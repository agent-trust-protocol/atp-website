/**
 * Process-wide WorkflowEngine + NodeRegistry singleton.
 *
 * The engine is stateful (holds registered workflows and active executions
 * in Maps) and the node registry refuses double-registration of the same
 * type. In Next.js dev with HMR and in serverless cold starts we want one
 * instance per process and idempotent setup.
 *
 * Register all ATP-domain node definitions at import time so every call
 * site that wants to execute a workflow can just call `getRuntime()`.
 */

import { WorkflowEngine } from '@/workflow-engine/core/WorkflowEngine';
import { NodeRegistry } from '@/workflow-engine/core/NodeRegistry';
import { trustNodeDefinitions } from '@/workflow-engine/nodes/atp/TrustNodes';
import { policyNodeDefinitions } from '@/workflow-engine/nodes/atp/PolicyNodes';
import { monitoringNodeDefinitions } from '@/workflow-engine/nodes/atp/MonitoringNodes';

interface Runtime {
  engine: WorkflowEngine;
  registry: NodeRegistry;
}

const globalKey = '__atp_workflow_runtime__';
type GlobalWithRuntime = typeof globalThis & { [globalKey]?: Runtime };

export function getRuntime(): Runtime {
  const g = globalThis as GlobalWithRuntime;
  if (g[globalKey]) return g[globalKey]!;

  const registry = new NodeRegistry();
  const allDefs = [
    ...trustNodeDefinitions,
    ...policyNodeDefinitions,
    ...monitoringNodeDefinitions
  ];
  for (const def of allDefs) {
    try {
      registry.registerNode(def);
    } catch (err) {
      // Idempotent — re-import (HMR) shouldn't blow up if a type is already there.
      if (!(err instanceof Error) || !err.message.includes('already registered')) throw err;
    }
  }

  const engine = new WorkflowEngine(registry);
  g[globalKey] = { engine, registry };
  return g[globalKey]!;
}
