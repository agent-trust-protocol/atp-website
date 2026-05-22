/**
 * Persistence wrapper around the pure executor in src/workflow-engine.
 *
 * Loads a workflow, calls executeWorkflow(), writes a workflow_executions
 * row + one node_executions row per step, and bumps workflow_stats. Pure
 * executor logic lives in src/workflow-engine/executor.ts so it can be
 * unit-tested without a DB.
 */

import { randomUUID } from 'node:crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/workflows/db';
import { queryOne } from '@/lib/db';
import { executeWorkflow, type NodeRuntime, type WorkflowDefinition } from '@/workflow-engine/executor';
import { createNodeHandlers } from '@/workflow-engine/node-handlers';
import type { Viewer } from '@/lib/viewer';

const { workflows, workflowExecutions, nodeExecutions, workflowStats } = schema;

export interface RunWorkflowResult {
  executionId: string;
  status: 'success' | 'failed';
  durationMs: number;
  error: string | null;
  nodeCount: number;
}

export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'event';

/**
 * Run a workflow synchronously. Throws on unrecoverable orchestration
 * errors (workflow not found, viewer not permitted); per-node failures
 * are recorded in node_executions and surfaced via the returned status.
 */
export async function runWorkflow(
  workflowId: string,
  viewer: Viewer,
  opts: { triggerType?: TriggerType; triggerInput?: unknown } = {}
): Promise<RunWorkflowResult> {
  const db = getDb();

  // Visibility check matches listWorkflows: founder sees all; otherwise the
  // viewer must own the workflow.
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!wf) throw new Error('Workflow not found');
  if (!viewer.isFounder && wf.createdBy !== viewer.userId) {
    throw new Error('Not permitted to run this workflow');
  }

  const definition = (wf.definition ?? {}) as WorkflowDefinition;
  const triggerType: TriggerType = opts.triggerType ?? 'manual';
  const executionId = randomUUID();
  const startTime = new Date();

  // Insert an in-flight row up front so the UI can show a 'running'
  // execution if we ever switch to async. Synchronous v1 will flip it to
  // its terminal state below.
  await db.insert(workflowExecutions).values({
    id: executionId,
    workflowId,
    workflowVersion: wf.version,
    status: 'running',
    startTime,
    triggeredBy: viewer.userId ?? 'system',
    triggerType,
    inputData: (opts.triggerInput as object | undefined) ?? null,
    outputData: null,
    errorMessage: null,
    metadata: null
  });

  // Resolve the workflow owner's email so action handlers (notably
  // send-alert) can default to it. Better Auth's user table is named
  // "user" (singular, quoted because user is a reserved word).
  const ownerRow = wf.createdBy
    ? await queryOne<{ email: string | null }>(`SELECT email FROM "user" WHERE id = $1`, [wf.createdBy])
    : null;

  const runtime: NodeRuntime = {
    workflowId,
    executionId,
    ownerUserId: wf.createdBy ?? null,
    ownerEmail: ownerRow?.email ?? null
  };

  const result = await executeWorkflow(definition, {
    handlers: createNodeHandlers(),
    runtime,
    triggerInput: opts.triggerInput
  });

  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  // Persist per-node records. Drizzle is happy with bulk insert.
  if (result.nodes.length > 0) {
    await db.insert(nodeExecutions).values(
      result.nodes.map((n) => ({
        id: randomUUID(),
        executionId,
        nodeId: n.nodeId,
        nodeType: n.nodeType,
        status: n.status,
        startTime: n.startedAt,
        endTime: n.endedAt,
        duration: n.durationMs,
        inputData: n.input as object,
        outputData: (n.output ?? null) as object | null,
        errorMessage: n.error,
        retryCount: 0
      }))
    );
  }

  await db.update(workflowExecutions)
    .set({
      status: result.status,
      endTime,
      duration: durationMs,
      outputData: { nodeCount: result.nodes.length } as object,
      errorMessage: result.error
    })
    .where(eq(workflowExecutions.id, executionId));

  await bumpWorkflowStats(workflowId, result.status, durationMs);

  return {
    executionId,
    status: result.status,
    durationMs,
    error: result.error,
    nodeCount: result.nodes.length
  };
}

/**
 * Upsert into workflow_stats. Drizzle's onConflictDoUpdate is the clean
 * path; falling back to a SELECT-then-UPDATE/INSERT keeps this readable
 * without a unique constraint on workflow_id (the schema doesn't declare
 * one — first run inserts, subsequent runs update by workflow_id).
 */
async function bumpWorkflowStats(
  workflowId: string,
  status: 'success' | 'failed',
  durationMs: number
) {
  const db = getDb();
  const [existing] = await db.select().from(workflowStats).where(eq(workflowStats.workflowId, workflowId)).limit(1);
  const now = new Date();
  if (!existing) {
    await db.insert(workflowStats).values({
      id: randomUUID(),
      workflowId,
      totalExecutions: 1,
      successfulExecutions: status === 'success' ? 1 : 0,
      failedExecutions: status === 'failed' ? 1 : 0,
      averageDuration: String(durationMs),
      lastExecutionTime: now,
      createdAt: now,
      updatedAt: now
    });
    return;
  }
  const prevTotal = existing.totalExecutions;
  const prevAvg = existing.averageDuration ? Number(existing.averageDuration) : 0;
  const nextAvg = (prevAvg * prevTotal + durationMs) / (prevTotal + 1);
  await db.update(workflowStats)
    .set({
      totalExecutions: existing.totalExecutions + 1,
      successfulExecutions: existing.successfulExecutions + (status === 'success' ? 1 : 0),
      failedExecutions: existing.failedExecutions + (status === 'failed' ? 1 : 0),
      averageDuration: String(Math.round(nextAvg * 100) / 100),
      lastExecutionTime: now,
      updatedAt: now
    })
    .where(eq(workflowStats.id, existing.id));
}

/**
 * Fetch an execution + its node_executions, scoped to the viewer's
 * workflows. Returns null for not-found / not-permitted (same shape
 * as Phase 2's other viewer-scoped reads).
 */
export async function getExecutionDetail(executionId: string, viewer: Viewer) {
  const db = getDb();
  const [exec] = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, executionId)).limit(1);
  if (!exec) return null;

  const [wf] = await db.select().from(workflows).where(eq(workflows.id, exec.workflowId)).limit(1);
  if (!wf) return null;
  if (!viewer.isFounder && wf.createdBy !== viewer.userId) return null;

  const nodes = await db.select().from(nodeExecutions).where(eq(nodeExecutions.executionId, executionId));
  return { execution: exec, workflow: wf, nodes };
}

/**
 * List executions for a single workflow, viewer-scoped. Used by the
 * execution-history view on the workflow detail page.
 */
export async function listExecutionsForWorkflow(workflowId: string, viewer: Viewer) {
  const db = getDb();
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!wf) return [];
  if (!viewer.isFounder && wf.createdBy !== viewer.userId) return [];
  return db.select()
    .from(workflowExecutions)
    .where(eq(workflowExecutions.workflowId, workflowId))
    .orderBy(sql`${workflowExecutions.startTime} DESC`)
    .limit(50);
}
