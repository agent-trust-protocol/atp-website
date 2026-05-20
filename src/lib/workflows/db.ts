/**
 * Drizzle ORM client bound to the shared pg.Pool from src/lib/db.ts.
 *
 * The dead-code `src/workflow-engine/database/connection.ts` previously
 * spun up a parallel `postgres-js` client with its own pool from a
 * different set of env vars — we don't use that. Phase 2 standardises on
 * one Pool and uses Drizzle purely as the typed query layer over it.
 */

import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getPool, initializeAppTables } from '@/lib/db';
import * as schema from '@/workflow-engine/database/schema';
import type { Viewer } from '@/lib/viewer';

const { workflows, workflowExecutions, workflowStats, nodeStats } = schema;

let cached: ReturnType<typeof drizzle> | null = null;
export function getDb() {
  if (!cached) cached = drizzle(getPool(), { schema, casing: 'snake_case' });
  return cached;
}

let initPromise: Promise<void> | null = null;
function ensureInit() {
  if (!initPromise) {
    initPromise = initializeAppTables().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

const ACTIVE_STATUSES = ['running', 'pending', 'queued'] as const;

function ownerFilter(viewer: Viewer) {
  if (viewer.isFounder) return undefined;
  if (!viewer.userId) return sql`FALSE`;
  return eq(workflows.createdBy, viewer.userId);
}

export async function listWorkflows(viewer: Viewer, opts: { status?: string; limit?: number } = {}) {
  await ensureInit();
  const db = getDb();
  const conds = [ownerFilter(viewer), opts.status ? eq(workflows.status, opts.status) : undefined].filter(Boolean);
  let q = db.select().from(workflows).where(conds.length ? and(...(conds as any[])) : undefined).orderBy(desc(workflows.createdAt));
  if (opts.limit && opts.limit > 0) q = q.limit(opts.limit) as typeof q;
  return q;
}

export async function createWorkflow(input: {
  name: string;
  description?: string | null;
  definition: unknown;
  category?: string | null;
  tags?: unknown;
}, owner: { userId: string }) {
  await ensureInit();
  const db = getDb();
  const id = randomUUID();
  const [row] = await db.insert(workflows).values({
    id,
    name: input.name,
    description: input.description ?? null,
    definition: input.definition as object,
    status: 'draft',
    createdBy: owner.userId,
    category: input.category ?? null,
    tags: (input.tags as object) ?? []
  }).returning();
  return row;
}

export async function listActiveExecutions(viewer: Viewer) {
  await ensureInit();
  const db = getDb();
  // Only return executions whose workflow the viewer can see.
  const visible = await db.select({ id: workflows.id, name: workflows.name }).from(workflows).where(ownerFilter(viewer));
  if (!visible.length) return [];
  const ids = visible.map((w) => w.id);
  const nameById = new Map(visible.map((w) => [w.id, w.name]));
  const rows = await db.select()
    .from(workflowExecutions)
    .where(and(inArray(workflowExecutions.workflowId, ids), inArray(workflowExecutions.status, ACTIVE_STATUSES as unknown as string[])))
    .orderBy(desc(workflowExecutions.startTime));
  return rows.map((r) => ({ ...r, workflowName: nameById.get(r.workflowId) ?? null }));
}

export async function getWorkflowEngineHealth(viewer: Viewer) {
  await ensureInit();
  const db = getDb();
  const visible = await db.select({ id: workflows.id }).from(workflows).where(ownerFilter(viewer));
  const visibleIds = visible.map((w) => w.id);

  if (!visibleIds.length) {
    return {
      status: 'healthy' as const,
      workflowsVisible: 0,
      executions: { total: 0, successful: 0, failed: 0, active: 0 },
      averageDurationMs: null as number | null,
      lastExecutionAt: null as string | null
    };
  }

  const stats = await db.select({
    totalExecutions: sql<number>`COALESCE(SUM(${workflowStats.totalExecutions}), 0)`.mapWith(Number),
    successfulExecutions: sql<number>`COALESCE(SUM(${workflowStats.successfulExecutions}), 0)`.mapWith(Number),
    failedExecutions: sql<number>`COALESCE(SUM(${workflowStats.failedExecutions}), 0)`.mapWith(Number),
    averageDuration: sql<string | null>`AVG(${workflowStats.averageDuration})`,
    lastExecutionTime: sql<Date | null>`MAX(${workflowStats.lastExecutionTime})`
  }).from(workflowStats).where(inArray(workflowStats.workflowId, visibleIds));

  const activeRows = await db.select({
    count: sql<number>`COUNT(*)`.mapWith(Number)
  }).from(workflowExecutions).where(and(
    inArray(workflowExecutions.workflowId, visibleIds),
    inArray(workflowExecutions.status, ACTIVE_STATUSES as unknown as string[])
  ));

  const s = stats[0];
  const active = activeRows[0]?.count ?? 0;
  return {
    status: 'healthy' as const,
    workflowsVisible: visibleIds.length,
    executions: {
      total: s.totalExecutions,
      successful: s.successfulExecutions,
      failed: s.failedExecutions,
      active
    },
    averageDurationMs: s.averageDuration != null ? Number(s.averageDuration) : null,
    lastExecutionAt: s.lastExecutionTime ? new Date(s.lastExecutionTime).toISOString() : null
  };
}

export { schema };
