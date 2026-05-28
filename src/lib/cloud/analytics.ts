/**
 * Analytics aggregations for /cloud/analytics. Replaces the hardcoded
 * `overview / hourlyData / topTenants` object on that page.
 *
 * Same scoping rule as src/lib/cloud/stats.ts (founder → platform-wide,
 * signed-in → "your stuff", anonymous → empty). Every query is safe()'d
 * so one broken table doesn't blank the whole page.
 *
 * "Requests" maps to `workflow_executions.count` (closest proxy we have;
 * we don't track HTTP requests). "Response time" maps to execution
 * duration. When a real request-volume metric lands, change the source
 * here — the consumer page only sees the shape.
 */

import { query, queryOne } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type TimeRange = '24h' | '7d' | '30d' | '90d';

const RANGE_TO_INTERVAL: Record<TimeRange, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days'
};

const RANGE_PRIOR_INTERVAL: Record<TimeRange, string> = {
  '24h': '48 hours',
  '7d': '14 days',
  '30d': '60 days',
  '90d': '180 days'
};

export interface AnalyticsOverview {
  totalRequests: number;
  requestGrowth: number;
  avgResponseTime: number;
  responseTimeChange: number;
  activeTenants: number;
  tenantGrowth: number;
  uptime: number;
}

export interface HourlyPoint {
  hour: string;
  requests: number;
  responseTime: number;
}

export interface TopTenant {
  name: string;
  requests: number;
  growth: number;
}

export interface CloudAnalytics {
  range: TimeRange;
  overview: AnalyticsOverview;
  hourlyData: HourlyPoint[];
  topTenants: TopTenant[];
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch (err) {
    console.error('[cloud/analytics] query failed', err instanceof Error ? err.message : err);
    return fallback;
  }
}

function pctChange(now: number, prior: number): number {
  if (prior === 0) return now === 0 ? 0 : 100;
  return Number((((now - prior) / prior) * 100).toFixed(1));
}

/** Scope SQL fragment + params for "workflow_executions visible to viewer". */
function execScope(viewer: Viewer): { join: string; where: string; param?: string } {
  if (viewer.isFounder) return { join: '', where: '' };
  return {
    join: ' INNER JOIN workflows w ON w.id = e.workflow_id',
    where: ' AND w.created_by = $1',
    param: viewer.userId!
  };
}

export async function getCloudAnalytics(viewer: Viewer, range: TimeRange = '7d'): Promise<CloudAnalytics> {
  const empty: CloudAnalytics = {
    range,
    overview: {
      totalRequests: 0, requestGrowth: 0,
      avgResponseTime: 0, responseTimeChange: 0,
      activeTenants: 0, tenantGrowth: 0,
      uptime: 0
    },
    hourlyData: [],
    topTenants: []
  };
  if (!viewer.isFounder && !viewer.userId) return empty;

  const interval = RANGE_TO_INTERVAL[range];
  const priorInterval = RANGE_PRIOR_INTERVAL[range];
  const { join, where, param } = execScope(viewer);
  const baseParams = param ? [param] : [];

  // -- Overview: executions, avg duration, success vs total ----------------
  const overviewRow = await safe(
    queryOne<{ count: string; avg_ms: string | null; success: string }>(
      `SELECT
         COUNT(*)::text                                                   AS count,
         AVG(e.duration)::text                                            AS avg_ms,
         COUNT(*) FILTER (WHERE e.status = 'success')::text               AS success
       FROM workflow_executions e${join}
       WHERE e.start_time > NOW() - INTERVAL '${interval}'${where}`,
      baseParams
    ),
    null
  );

  const priorOverviewRow = await safe(
    queryOne<{ count: string; avg_ms: string | null }>(
      `SELECT
         COUNT(*)::text                          AS count,
         AVG(e.duration)::text                   AS avg_ms
       FROM workflow_executions e${join}
       WHERE e.start_time > NOW() - INTERVAL '${priorInterval}'
         AND e.start_time <= NOW() - INTERVAL '${interval}'${where}`,
      baseParams
    ),
    null
  );

  const totalRequests = overviewRow ? Number(overviewRow.count) || 0 : 0;
  const priorRequests = priorOverviewRow ? Number(priorOverviewRow.count) || 0 : 0;
  const avgResponseTime = overviewRow?.avg_ms ? Math.round(Number(overviewRow.avg_ms)) : 0;
  const priorAvg = priorOverviewRow?.avg_ms ? Math.round(Number(priorOverviewRow.avg_ms)) : 0;
  const successCount = overviewRow ? Number(overviewRow.success) || 0 : 0;
  const uptime = totalRequests > 0 ? Number(((successCount / totalRequests) * 100).toFixed(2)) : 100;

  // -- Active tenants ------------------------------------------------------
  const activeTenantsRow = await safe(
    queryOne<{ count: string }>(
      viewer.isFounder
        ? `SELECT COUNT(*)::text AS count FROM tenants WHERE status = 'active'`
        : `SELECT COUNT(*)::text AS count FROM tenants t INNER JOIN user_tenants ut ON ut.tenant_id = t.id WHERE ut.user_id = $1 AND t.status = 'active'`,
      viewer.isFounder ? [] : [viewer.userId!]
    ),
    null
  );
  const priorActiveTenantsRow = await safe(
    queryOne<{ count: string }>(
      viewer.isFounder
        ? `SELECT COUNT(*)::text AS count FROM tenants WHERE status = 'active' AND created_at <= NOW() - INTERVAL '${interval}'`
        : `SELECT COUNT(*)::text AS count FROM tenants t INNER JOIN user_tenants ut ON ut.tenant_id = t.id WHERE ut.user_id = $1 AND t.status = 'active' AND t.created_at <= NOW() - INTERVAL '${interval}'`,
      viewer.isFounder ? [] : [viewer.userId!]
    ),
    null
  );
  const activeTenants = activeTenantsRow ? Number(activeTenantsRow.count) || 0 : 0;
  const priorActiveTenants = priorActiveTenantsRow ? Number(priorActiveTenantsRow.count) || 0 : 0;

  // -- Hourly buckets: last 24 hours always (the chart only renders 5
  //    waypoints regardless of `range`; this matches the prior UX). -------
  const hourly = await safe(
    query<{ bucket: string; count: string; avg_ms: string | null }>(
      `SELECT
         date_trunc('hour', e.start_time)                AS bucket,
         COUNT(*)::text                                  AS count,
         AVG(e.duration)::text                           AS avg_ms
       FROM workflow_executions e${join}
       WHERE e.start_time > NOW() - INTERVAL '24 hours'${where}
       GROUP BY bucket
       ORDER BY bucket`,
      baseParams
    ),
    []
  );
  const hourlyData: HourlyPoint[] = hourly.map((r) => ({
    hour: new Date(r.bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requests: Number(r.count) || 0,
    responseTime: r.avg_ms ? Math.round(Number(r.avg_ms)) : 0
  }));

  // -- Top tenants by audit-log volume in the window. We don't have
  //    per-tenant request counters, but audit_logs.user_id ↔ user_tenants
  //    is the best proxy. Founders see all tenants; users see their own. -
  const top = await safe(
    query<{ name: string; n: string }>(
      viewer.isFounder
        ? `SELECT t.name AS name, COUNT(a.id)::text AS n
           FROM audit_logs a
           INNER JOIN user_tenants ut ON ut.user_id = a.user_id
           INNER JOIN tenants t ON t.id = ut.tenant_id
           WHERE a.timestamp > NOW() - INTERVAL '${interval}'
           GROUP BY t.id, t.name
           ORDER BY COUNT(a.id) DESC
           LIMIT 5`
        : `SELECT t.name AS name, COUNT(a.id)::text AS n
           FROM audit_logs a
           INNER JOIN user_tenants ut ON ut.user_id = a.user_id
           INNER JOIN tenants t ON t.id = ut.tenant_id
           WHERE a.timestamp > NOW() - INTERVAL '${interval}' AND ut.user_id = $1
           GROUP BY t.id, t.name
           ORDER BY COUNT(a.id) DESC
           LIMIT 5`,
      viewer.isFounder ? [] : [viewer.userId!]
    ),
    []
  );
  const topTenants: TopTenant[] = top.map((r) => ({
    name: r.name,
    requests: Number(r.n) || 0,
    // Per-tenant growth would require a second indexed scan; v1 leaves
    // it at 0 rather than render fabricated movement.
    growth: 0
  }));

  return {
    range,
    overview: {
      totalRequests,
      requestGrowth: pctChange(totalRequests, priorRequests),
      avgResponseTime,
      responseTimeChange: pctChange(avgResponseTime, priorAvg),
      activeTenants,
      tenantGrowth: pctChange(activeTenants, priorActiveTenants),
      uptime
    },
    hourlyData,
    topTenants
  };
}
