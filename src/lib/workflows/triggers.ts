/**
 * Workflow trigger persistence + due-detection. PR #41 of the worker
 * series — schedule + webhook triggers.
 *
 * The Drizzle `workflow_triggers` table from Phase 2 stores the trigger;
 * we use the row's UUID as the webhook secret (URL-as-token model) so no
 * schema change is needed for v1. Trigger configuration shape:
 *
 *   schedule: { intervalSeconds: number }
 *   webhook:  { method?: 'POST' }
 *   manual:   {}
 */

import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { getDb, schema } from './db';
import type { Viewer } from '@/lib/viewer';

const { workflows, workflowTriggers } = schema;

export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'event';

export interface TriggerRow {
  id: string;
  workflowId: string;
  type: TriggerType;
  name: string;
  configuration: Record<string, unknown>;
  isEnabled: boolean;
  lastTriggered: Date | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

async function assertWorkflowOwned(workflowId: string, viewer: Viewer) {
  const db = getDb();
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  if (!wf) throw new Error('Workflow not found');
  if (!viewer.isFounder && wf.createdBy !== viewer.userId) {
    throw new Error('Not permitted to manage triggers on this workflow');
  }
  return wf;
}

export async function listTriggersForWorkflow(workflowId: string, viewer: Viewer): Promise<TriggerRow[]> {
  await assertWorkflowOwned(workflowId, viewer);
  const db = getDb();
  const rows = await db.select()
    .from(workflowTriggers)
    .where(eq(workflowTriggers.workflowId, workflowId))
    .orderBy(workflowTriggers.createdAt);
  return rows as unknown as TriggerRow[];
}

export async function createTrigger(
  workflowId: string,
  input: { type: TriggerType; name: string; configuration?: Record<string, unknown>; isEnabled?: boolean },
  viewer: Viewer
): Promise<TriggerRow> {
  await assertWorkflowOwned(workflowId, viewer);
  const db = getDb();
  const id = randomUUID();
  const [row] = await db.insert(workflowTriggers).values({
    id,
    workflowId,
    type: input.type,
    name: input.name,
    configuration: input.configuration ?? {},
    isEnabled: input.isEnabled ?? true,
    triggerCount: 0
  }).returning();
  return row as unknown as TriggerRow;
}

export async function deleteTrigger(triggerId: string, viewer: Viewer): Promise<boolean> {
  const db = getDb();
  const [trig] = await db.select().from(workflowTriggers).where(eq(workflowTriggers.id, triggerId)).limit(1);
  if (!trig) return false;
  await assertWorkflowOwned(trig.workflowId, viewer);
  await db.delete(workflowTriggers).where(eq(workflowTriggers.id, triggerId));
  return true;
}

/** Bump last_triggered + trigger_count after a successful fire. */
export async function markTriggerFired(triggerId: string) {
  const db = getDb();
  await db.update(workflowTriggers)
    .set({
      lastTriggered: new Date(),
      triggerCount: sql`${workflowTriggers.triggerCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(workflowTriggers.id, triggerId));
}

/**
 * Find a webhook trigger by its id (which doubles as the URL secret).
 * Returns the trigger + the workflow's createdBy so the caller can run
 * the workflow as its owner. Returns null if not found or disabled.
 */
export async function findWebhookTrigger(triggerId: string) {
  const db = getDb();
  const [row] = await db.select({
    trigger: workflowTriggers,
    workflowOwner: workflows.createdBy
  })
    .from(workflowTriggers)
    .innerJoin(workflows, eq(workflows.id, workflowTriggers.workflowId))
    .where(and(
      eq(workflowTriggers.id, triggerId),
      eq(workflowTriggers.type, 'webhook'),
      eq(workflowTriggers.isEnabled, true)
    ))
    .limit(1);
  return row ?? null;
}

/**
 * Find event triggers matching an event type and optional filter.
 * Used by the policy engine to auto-fire workflows when a policy
 * decision lands on a non-allow outcome.
 *
 * Trigger configuration shape for `type='event'`:
 *   { event: 'policy.violation', policyId?: '<uuid>' }
 *
 * If `policyId` is set, the trigger only fires for that specific
 * policy; otherwise it fires for any matching event.
 */
export async function findEventTriggers(eventType: string, filter: { policyId?: string } = {}) {
  const db = getDb();
  const rows = await db.execute<{
    id: string;
    workflow_id: string;
    name: string;
    configuration: Record<string, unknown>;
    created_by: string | null;
  }>(sql`
    SELECT t.id, t.workflow_id, t.name, t.configuration, w.created_by
    FROM workflow_triggers t
    INNER JOIN workflows w ON w.id = t.workflow_id
    WHERE t.type = 'event'
      AND t.is_enabled = true
      AND t.configuration->>'event' = ${eventType}
      AND (
        ${filter.policyId ?? null}::text IS NULL
        OR t.configuration->>'policyId' IS NULL
        OR t.configuration->>'policyId' = ${filter.policyId ?? null}
      )
  `);
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? []) as Array<{
    id: string;
    workflow_id: string;
    name: string;
    configuration: Record<string, unknown>;
    created_by: string | null;
  }>;
}

/**
 * Fire an event by dispatching to every matching event trigger. Bounded
 * concurrency — runs at most CONCURRENCY workflows in parallel so a busy
 * event source can't blow out the connection pool.
 *
 * Synchronous on purpose for v1: the caller awaits all workflow runs so
 * Vercel serverless functions don't terminate mid-run. If subscriber count
 * grows past a handful, swap to a queue table processed by the cron.
 */
const CONCURRENCY = 5;
export async function fireEvent(
  eventType: string,
  payload: { policyId?: string; [k: string]: unknown }
): Promise<{ fired: number; failed: number }> {
  // Imported lazily to avoid a circular dep (execute.ts → workflows/db → triggers
  // and we want triggers → execute.ts indirectly here).
  const { runWorkflow } = await import('./execute');

  const triggers = await findEventTriggers(eventType, { policyId: payload.policyId });
  let fired = 0;
  let failed = 0;

  // Simple parallel-bounded loop without a dep.
  for (let i = 0; i < triggers.length; i += CONCURRENCY) {
    const batch = triggers.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (t) => {
        if (!t.created_by) {
          throw new Error('workflow has no owner');
        }
        const result = await runWorkflow(
          t.workflow_id,
          { userId: t.created_by, isFounder: false },
          { triggerType: 'event', triggerInput: { triggerId: t.id, triggerName: t.name, event: eventType, ...payload } }
        );
        await markTriggerFired(t.id);
        return result;
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') fired += 1;
      else { failed += 1; console.error('[fireEvent]', r.reason); }
    }
  }
  return { fired, failed };
}

/**
 * Schedule triggers due for firing — `last_triggered + intervalSeconds < now()`.
 * Returns the trigger + owner pair for each. Caller (cron endpoint) fires
 * them sequentially.
 */
export async function listDueScheduleTriggers(limit = 50) {
  // Use raw SQL: comparing a numeric interval against a JSONB-stored value
  // is awkward in Drizzle's builder, and a hand-written WHERE is clearer
  // about the time math.
  const db = getDb();
  const rows = await db.execute<{
    id: string;
    workflow_id: string;
    name: string;
    configuration: Record<string, unknown>;
    created_by: string | null;
  }>(sql`
    SELECT t.id, t.workflow_id, t.name, t.configuration, w.created_by
    FROM workflow_triggers t
    INNER JOIN workflows w ON w.id = t.workflow_id
    WHERE t.type = 'schedule'
      AND t.is_enabled = true
      AND (
        t.last_triggered IS NULL
        OR t.last_triggered + (
          COALESCE((t.configuration->>'intervalSeconds')::int, 60)
        ) * INTERVAL '1 second' < NOW()
      )
    ORDER BY COALESCE(t.last_triggered, t.created_at) ASC
    LIMIT ${limit}
  `);
  // node-postgres returns { rows }; pg-pool already does too via Drizzle.
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? []) as Array<{
    id: string;
    workflow_id: string;
    name: string;
    configuration: Record<string, unknown>;
    created_by: string | null;
  }>;
}
