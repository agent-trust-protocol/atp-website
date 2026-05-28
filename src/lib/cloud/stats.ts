/**
 * Live counts for the /cloud dashboard cards. Replaces the hardcoded
 * `{ totalTenants: 12, activeTenants: 8, ... }` literal that used to
 * live in src/app/cloud/page.tsx.
 *
 * Scoping rule mirrors the rest of the app:
 *   - founder      → platform-wide counts
 *   - signed-in    → "your" counts (tenants you're a member of,
 *                     agents/workflows you own, executions you ran)
 *   - anonymous    → zeros
 *
 * Every count is wrapped in a safe() helper because /cloud rendering
 * a 500 because one COUNT(*) failed is much worse than rendering a 0.
 */

import { queryOne } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export interface CloudStats {
  totalTenants: number;
  activeTenants: number;
  totalAgents: number;
  totalWorkflows: number;
  totalExecutions: number;
  /** Sum of workflow execution durations (ms) across `totalExecutions`. */
  totalDurationMs: number;
}

async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const row = await queryOne<{ n: string }>(sql, params);
    return row ? Number(row.n) || 0 : 0;
  } catch (err) {
    console.error('[cloud/stats] count failed', err instanceof Error ? err.message : err);
    return 0;
  }
}

export async function getCloudStats(viewer: Viewer): Promise<CloudStats> {
  if (!viewer.isFounder && !viewer.userId) {
    return { totalTenants: 0, activeTenants: 0, totalAgents: 0, totalWorkflows: 0, totalExecutions: 0, totalDurationMs: 0 };
  }

  const u = viewer.userId;
  const isFounder = viewer.isFounder;

  const [totalTenants, activeTenants, totalAgents, totalWorkflows, totalExecutions, durationSum] = await Promise.all([
    isFounder
      ? safeCount(`SELECT COUNT(*)::text AS n FROM tenants`)
      : safeCount(`SELECT COUNT(*)::text AS n FROM tenants t INNER JOIN user_tenants ut ON ut.tenant_id = t.id WHERE ut.user_id = $1`, [u]),
    isFounder
      ? safeCount(`SELECT COUNT(*)::text AS n FROM tenants WHERE status = 'active'`)
      : safeCount(`SELECT COUNT(*)::text AS n FROM tenants t INNER JOIN user_tenants ut ON ut.tenant_id = t.id WHERE ut.user_id = $1 AND t.status = 'active'`, [u]),
    isFounder
      ? safeCount(`SELECT COUNT(*)::text AS n FROM agents`)
      : safeCount(`SELECT COUNT(*)::text AS n FROM agents WHERE owner_user_id = $1`, [u]),
    isFounder
      ? safeCount(`SELECT COUNT(*)::text AS n FROM workflows`)
      : safeCount(`SELECT COUNT(*)::text AS n FROM workflows WHERE created_by = $1`, [u]),
    isFounder
      ? safeCount(`SELECT COUNT(*)::text AS n FROM workflow_executions`)
      : safeCount(`SELECT COUNT(*)::text AS n FROM workflow_executions e INNER JOIN workflows w ON w.id = e.workflow_id WHERE w.created_by = $1`, [u]),
    isFounder
      ? safeCount(`SELECT COALESCE(SUM(duration), 0)::text AS n FROM workflow_executions`)
      : safeCount(`SELECT COALESCE(SUM(e.duration), 0)::text AS n FROM workflow_executions e INNER JOIN workflows w ON w.id = e.workflow_id WHERE w.created_by = $1`, [u])
  ]);

  return {
    totalTenants,
    activeTenants,
    totalAgents,
    totalWorkflows,
    totalExecutions,
    totalDurationMs: durationSum
  };
}
