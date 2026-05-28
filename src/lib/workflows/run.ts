/**
 * Workflow execution path.
 *
 * Bridges three shapes that don't quite match:
 *   - DB row     (snake_case columns, React Flow node/edge JSON)
 *   - React Flow (nodes have `data.type` for the real handler type;
 *                 edges use `source`/`target`)
 *   - Engine     (WorkflowNode.type IS the handler type, edges use
 *                 sourceNodeId/targetNodeId, exactly one node must
 *                 carry isStartNode)
 *
 * `toEngineWorkflow` does the adaptation. `runWorkflow` registers the
 * adapted workflow, executes it, and persists the result to
 * workflow_executions.
 */

import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';
import { getWorkflow, type WorkflowRow } from '@/lib/workflows/store';
import { getRuntime } from '@/lib/workflows/runtime';
import type {
  Workflow as EngineWorkflow,
  WorkflowNode as EngineNode,
  WorkflowEdge as EngineEdge,
  ExecutionResult
} from '@/workflow-engine/types/WorkflowTypes';

export class NotFound extends Error {
  constructor(message = 'Workflow not found') { super(message); this.name = 'NotFound'; }
}
export class NotAuthorized extends Error {
  constructor(message = 'Authentication required') { super(message); this.name = 'NotAuthorized'; }
}

interface RFNode {
  id: string;
  type?: string; // React Flow shape class ('trigger','action',...); informational only
  position?: { x: number; y: number };
  data?: { label?: string; type?: string; inputs?: Record<string, any> };
}
interface RFEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Convert a stored WorkflowRow into the engine's Workflow shape. The
 * start node is whichever node has no incoming edges (or the first
 * node if every node is targeted — the engine will reject that with a
 * cycle error, which is the right outcome).
 */
export function toEngineWorkflow(row: WorkflowRow): EngineWorkflow {
  const rawNodes = Array.isArray(row.nodes) ? (row.nodes as RFNode[]) : [];
  const rawEdges = Array.isArray(row.edges) ? (row.edges as RFEdge[]) : [];

  const targets = new Set(rawEdges.map((e) => e.target));
  const startId = rawNodes.find((n) => !targets.has(n.id))?.id ?? rawNodes[0]?.id;

  const nodes: EngineNode[] = rawNodes.map((n) => ({
    id: n.id,
    type: n.data?.type ?? n.type ?? 'unknown',
    label: n.data?.label ?? n.id,
    inputs: n.data?.inputs ?? {},
    position: n.position,
    isStartNode: n.id === startId
  }));

  const edges: EngineEdge[] = rawEdges.map((e, i) => ({
    id: e.id ?? `e_${i}`,
    sourceNodeId: e.source,
    targetNodeId: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined
  }));

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: '1.0.0',
    nodes,
    edges,
    variables: (row.variables ?? {}) as Record<string, any>
  };
}

export interface RunWorkflowOptions {
  initialData?: Record<string, unknown>;
}

export interface RunWorkflowOutcome {
  executionId: string;
  state: 'completed' | 'failed';
  durationMs: number;
  result?: ExecutionResult;
  error?: string;
}

export async function runWorkflow(
  viewer: Viewer,
  workflowId: string,
  opts: RunWorkflowOptions = {}
): Promise<RunWorkflowOutcome> {
  if (!viewer.userId) throw new NotAuthorized();

  const row = await getWorkflow(viewer, workflowId);
  if (!row) throw new NotFound();

  const engineWorkflow = toEngineWorkflow(row);
  const { engine } = getRuntime();

  // The engine validates on registration and rejects duplicates of an
  // already-registered id only via Map.set semantics (it overwrites);
  // re-registering with the latest definition is what we want.
  await engine.registerWorkflow(engineWorkflow);

  const executionId = `exe_${randomUUID()}`;
  const startedAt = new Date();

  await execute(
    `INSERT INTO workflow_executions (id, workflow_id, user_id, state, start_time, initial_data)
     VALUES ($1, $2, $3, 'running', $4, $5::jsonb)`,
    [executionId, row.id, viewer.userId, startedAt, JSON.stringify(opts.initialData ?? {})]
  );

  try {
    const result = await engine.executeWorkflow(workflowId, opts.initialData ?? {});
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - startedAt.getTime();

    await execute(
      `UPDATE workflow_executions
         SET state = 'completed',
             end_time = $2,
             duration_ms = $3,
             result = $4::jsonb
       WHERE id = $1`,
      [executionId, endedAt, durationMs, JSON.stringify(result)]
    );

    return { executionId, state: 'completed', durationMs, result };
  } catch (err) {
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - startedAt.getTime();
    const message = err instanceof Error ? err.message : String(err);

    await execute(
      `UPDATE workflow_executions
         SET state = 'failed',
             end_time = $2,
             duration_ms = $3,
             error = $4
       WHERE id = $1`,
      [executionId, endedAt, durationMs, message]
    );

    return { executionId, state: 'failed', durationMs, error: message };
  }
}

export interface ExecutionRow {
  id: string;
  workflow_id: string;
  user_id: string;
  state: 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  error: string | null;
  completed_nodes: string[];
}

export async function listExecutions(
  viewer: Viewer,
  opts: { state?: string; limit?: number } = {}
): Promise<ExecutionRow[]> {
  if (!viewer.userId && !viewer.isFounder) return [];

  const params: unknown[] = [];
  const clauses: string[] = [];
  if (!viewer.isFounder) {
    params.push(viewer.userId);
    clauses.push(`user_id = $${params.length}`);
  }
  if (opts.state) {
    params.push(opts.state);
    clauses.push(`state = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Math.min(opts.limit ?? 50, 200);

  return query<ExecutionRow>(
    `SELECT id, workflow_id, user_id, state, start_time, end_time, duration_ms, error, completed_nodes
     FROM workflow_executions ${where} ORDER BY start_time DESC LIMIT ${limit}`,
    params
  );
}

export function executionToApi(row: ExecutionRow) {
  return {
    executionId: row.id,
    workflowId: row.workflow_id,
    state: row.state,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration_ms,
    error: row.error,
    completedNodes: row.completed_nodes
  };
}
