/**
 * Pure workflow executor — walks a React Flow graph (nodes + edges) and
 * produces a list of NodeRunRecord results. Knows nothing about Postgres;
 * the `src/lib/workflows/execute.ts` wrapper handles persistence.
 *
 * Execution model (v1):
 *   - Starting set: every node with React Flow type 'trigger' OR no incoming
 *     edges. Each receives an empty input payload.
 *   - BFS-ish walk: a node is run after every incoming predecessor has
 *     completed successfully. Its input is the merged outputs of all
 *     predecessors keyed by source-handle name (defaults to 'out').
 *   - Conditions: handler returns `{ branch: 'true' | 'false', ... }`.
 *     Only outgoing edges whose sourceHandle matches the chosen branch
 *     are followed. Edges with no sourceHandle on a condition node are
 *     treated as the 'true' branch.
 *   - First node failure stops the run; remaining unexecuted nodes are
 *     marked 'skipped'.
 *   - Hard cap of MAX_NODES (200) executions per run to defend against
 *     malformed graphs.
 */

export interface RfNode {
  id: string;
  type?: string; // React Flow type (trigger|action|condition|output)
  data?: { label?: string; type?: string }; // data.type is the catalog nodeType
}

export interface RfEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowDefinition {
  nodes?: RfNode[];
  edges?: RfEdge[];
}

export interface NodeRunContext {
  nodeId: string;
  nodeType: string;
  /** Merged inputs from upstream nodes, keyed by source-handle name. */
  inputs: Record<string, unknown>;
}

export interface NodeRunResult {
  output: unknown;
  /** For condition nodes — which outgoing branch was chosen. */
  branch?: string;
}

export type NodeHandler = (ctx: NodeRunContext) => Promise<NodeRunResult> | NodeRunResult;

export type NodeStatus = 'success' | 'failed' | 'skipped';

export interface NodeRunRecord {
  nodeId: string;
  nodeType: string;
  status: NodeStatus;
  startedAt: Date;
  endedAt: Date;
  durationMs: number;
  input: Record<string, unknown>;
  output: unknown;
  error: string | null;
}

export interface ExecuteOptions {
  /** Map of catalog nodeType → handler. Missing keys fall back to a no-op. */
  handlers: Record<string, NodeHandler>;
  /** Optional payload available to every node as inputs.__trigger. */
  triggerInput?: unknown;
}

const MAX_NODES = 200;
const FALLBACK_HANDLE = 'out';

function isTriggerNode(node: RfNode, incomingByTarget: Map<string, RfEdge[]>): boolean {
  if (node.type === 'trigger') return true;
  const incoming = incomingByTarget.get(node.id);
  return !incoming || incoming.length === 0;
}

function indexEdges(edges: RfEdge[]) {
  const outgoingBySource = new Map<string, RfEdge[]>();
  const incomingByTarget = new Map<string, RfEdge[]>();
  for (const e of edges) {
    (outgoingBySource.get(e.source) ?? outgoingBySource.set(e.source, []).get(e.source)!).push(e);
    (incomingByTarget.get(e.target) ?? incomingByTarget.set(e.target, []).get(e.target)!).push(e);
  }
  return { outgoingBySource, incomingByTarget };
}

export async function executeWorkflow(
  definition: WorkflowDefinition,
  opts: ExecuteOptions
): Promise<{
  nodes: NodeRunRecord[];
  status: 'success' | 'failed';
  error: string | null;
}> {
  const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
  const edges = Array.isArray(definition.edges) ? definition.edges : [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const { outgoingBySource, incomingByTarget } = indexEdges(edges);

  const results = new Map<string, NodeRunRecord>();
  const ready: string[] = nodes.filter((n) => isTriggerNode(n, incomingByTarget)).map((n) => n.id);

  let executed = 0;
  let runFailed = false;
  let runError: string | null = null;

  while (ready.length > 0 && executed < MAX_NODES && !runFailed) {
    const nodeId = ready.shift()!;
    if (results.has(nodeId)) continue;
    const node = nodeById.get(nodeId);
    if (!node) continue;

    // Wait for every predecessor to have a record. If any predecessor failed
    // or was skipped, this node is skipped too.
    const incoming = incomingByTarget.get(nodeId) ?? [];
    const preds = incoming.map((e) => results.get(e.source));
    if (incoming.length && preds.some((p) => !p)) {
      // Predecessors not all done — requeue and continue.
      ready.push(nodeId);
      // Defensive: if every queued item is waiting, break to avoid spin.
      if (ready.every((id) => (incomingByTarget.get(id) ?? []).some((e) => !results.has(e.source)))) {
        break;
      }
      continue;
    }
    if (preds.some((p) => p && p.status !== 'success')) {
      const record: NodeRunRecord = {
        nodeId,
        nodeType: node.data?.type ?? node.type ?? 'unknown',
        status: 'skipped',
        startedAt: new Date(),
        endedAt: new Date(),
        durationMs: 0,
        input: {},
        output: null,
        error: 'Upstream node did not succeed'
      };
      results.set(nodeId, record);
      executed += 1;
      continue;
    }

    const inputs: Record<string, unknown> = {};
    if (opts.triggerInput !== undefined) inputs.__trigger = opts.triggerInput;
    for (const edge of incoming) {
      const pred = results.get(edge.source)!;
      const handle = edge.sourceHandle || FALLBACK_HANDLE;
      // Last-writer-wins on handle collision; deterministic per edge order.
      inputs[handle] = pred.output;
    }

    const nodeType = node.data?.type ?? node.type ?? 'unknown';
    const handler = opts.handlers[nodeType];
    const startedAt = new Date();
    let record: NodeRunRecord;

    if (!handler) {
      const endedAt = new Date();
      record = {
        nodeId,
        nodeType,
        status: 'failed',
        startedAt,
        endedAt,
        durationMs: endedAt.getTime() - startedAt.getTime(),
        input: inputs,
        output: null,
        error: `No handler registered for node type "${nodeType}"`
      };
      runFailed = true;
      runError = record.error;
    } else {
      try {
        const result = await handler({ nodeId, nodeType, inputs });
        const endedAt = new Date();
        record = {
          nodeId,
          nodeType,
          status: 'success',
          startedAt,
          endedAt,
          durationMs: endedAt.getTime() - startedAt.getTime(),
          input: inputs,
          output: result.output,
          error: null
        };
        // Enqueue successors. For condition nodes with a branch choice,
        // filter to outgoing edges whose sourceHandle matches.
        const outgoing = outgoingBySource.get(nodeId) ?? [];
        for (const edge of outgoing) {
          if (result.branch !== undefined) {
            const handle = edge.sourceHandle ?? 'true';
            if (handle !== result.branch) continue;
          }
          if (!results.has(edge.target)) ready.push(edge.target);
        }
      } catch (err) {
        const endedAt = new Date();
        record = {
          nodeId,
          nodeType,
          status: 'failed',
          startedAt,
          endedAt,
          durationMs: endedAt.getTime() - startedAt.getTime(),
          input: inputs,
          output: null,
          error: err instanceof Error ? err.message : String(err)
        };
        runFailed = true;
        runError = record.error;
      }
    }

    results.set(nodeId, record);
    executed += 1;
  }

  if (executed >= MAX_NODES && !runFailed) {
    runFailed = true;
    runError = `Aborted: exceeded MAX_NODES (${MAX_NODES}). Likely a cycle or oversized graph.`;
  }

  // Any nodes that never ran (disconnected, or downstream of a stuck branch)
  // are recorded as skipped so the UI doesn't have to handle missing rows.
  for (const node of nodes) {
    if (!results.has(node.id)) {
      const now = new Date();
      results.set(node.id, {
        nodeId: node.id,
        nodeType: node.data?.type ?? node.type ?? 'unknown',
        status: 'skipped',
        startedAt: now,
        endedAt: now,
        durationMs: 0,
        input: {},
        output: null,
        error: runFailed ? 'Run aborted before this node was reached' : 'Unreachable from any trigger'
      });
    }
  }

  return {
    nodes: Array.from(results.values()).sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime()),
    status: runFailed ? 'failed' : 'success',
    error: runError
  };
}
