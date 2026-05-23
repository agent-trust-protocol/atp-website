/**
 * Local monitoring aggregator. Replaces the previous proxy to an external
 * `ATP_MONITORING_URL` (which never existed in production) with real
 * Postgres aggregation across the data we already have: Better Auth
 * sessions, workflow_executions, agents, policies, audit_logs, api_keys.
 *
 * Returns the same response shape the old proxy fallback advertised so
 * the existing `PerformanceMetricsPreview` mapping keeps working — the
 * numbers are just real now instead of zeroed.
 */

import { query, queryOne } from '@/lib/db';

export interface MonitoringSnapshot {
  success: boolean;
  data: {
    timestamp: string;
    services: Array<{ name: string; status: 'healthy' | 'degraded' | 'down'; detail?: string }>;
    performance: {
      activeConnections: number;
      signaturesGenerated: number;
      avgResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    security: {
      trustTransactions: number;
      failedAuthentications: number;
      compromisedAgents: number;
      quantumThreats: number;
    };
    business: {
      registeredAgents: number;
      activeAgents: number;
      credentialsIssued: number;
      auditEvents: number;
    };
  };
}

/** Best-effort: any query that throws contributes 0 to that field. We never
 *  want the whole monitoring panel to 500 because one table got renamed. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function pickNumber(row: Record<string, unknown> | null, key: string): number {
  if (!row) return 0;
  const v = row[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  return 0;
}

export async function computeMonitoringSnapshot(): Promise<MonitoringSnapshot> {
  // -- Performance --------------------------------------------------------
  // Active connections: sessions in Better Auth's "session" table whose
  // expiresAt is in the future. The table column name varies by Better
  // Auth version; we try both.
  const activeSessions = await safe(
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "session"
       WHERE COALESCE("expiresAt", expires_at) > NOW()`
    ),
    null
  );

  // Workflow execution stats over the last hour.
  const execStats = await safe(
    queryOne<{
      count: string;
      avg_duration_ms: string | null;
      success_count: string;
      failed_count: string;
    }>(
      `SELECT
         COUNT(*)::text                                                    AS count,
         AVG(duration)::text                                               AS avg_duration_ms,
         COUNT(*) FILTER (WHERE status = 'success')::text                  AS success_count,
         COUNT(*) FILTER (WHERE status = 'failed')::text                   AS failed_count
       FROM workflow_executions
       WHERE start_time > NOW() - INTERVAL '1 hour'`
    ),
    null
  );

  // Executions in the last 60 seconds — drives requestsPerSecond.
  const recent = await safe(
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM workflow_executions
       WHERE start_time > NOW() - INTERVAL '60 seconds'`
    ),
    null
  );

  // Workflow executions today — drives "signaturesGenerated" (workflows
  // are the closest thing we have to "signed operations"; this is the
  // most honest mapping until a real signature counter exists).
  const today = await safe(
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM workflow_executions
       WHERE start_time > NOW() - INTERVAL '24 hours'`
    ),
    null
  );

  const hourlyCount = pickNumber(execStats, 'count');
  const successCount = pickNumber(execStats, 'success_count');
  const failedCount = pickNumber(execStats, 'failed_count');
  const errorRate = hourlyCount > 0 ? Math.round((failedCount / hourlyCount) * 10000) / 100 : 0;
  const requestsPerSecond = Math.round((pickNumber(recent, 'count') / 60) * 100) / 100;

  // Node process memory — heap usage % is a reasonable proxy for "memory
  // pressure" on a single function instance. CPU is harder without a
  // baseline, so we leave it 0 (preferable to a fake number).
  const mem = process.memoryUsage();
  const memoryUsage = mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0;

  // -- Business -----------------------------------------------------------
  const agentCounts = await safe(
    queryOne<{ total: string; active: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status = 'active')::text AS active
       FROM agents`
    ),
    null
  );

  const credCount = await safe(
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM api_keys WHERE status = 'active'`
    ),
    null
  );

  const auditCount = await safe(
    queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit_logs
       WHERE timestamp > NOW() - INTERVAL '24 hours'`
    ),
    null
  );

  // -- Services -----------------------------------------------------------
  // Honest health: the DB is "healthy" if the queries above didn't throw
  // (i.e. at least one returned a row). Anything else is "unknown" and we
  // don't fabricate.
  const dbHealthy = [activeSessions, execStats, recent, today, agentCounts, credCount, auditCount].some(
    (r) => r !== null
  );
  const services: MonitoringSnapshot['data']['services'] = [
    {
      name: 'Database',
      status: dbHealthy ? 'healthy' : 'down',
      detail: dbHealthy ? 'Postgres connection responsive' : 'No queries succeeded this tick'
    },
    {
      name: 'Workflow Engine',
      status: hourlyCount === 0 ? 'healthy' : errorRate > 10 ? 'degraded' : 'healthy',
      detail:
        hourlyCount === 0
          ? 'Idle (no executions in last hour)'
          : `${hourlyCount} runs/hr · ${errorRate.toFixed(2)}% error`
    }
  ];

  return {
    success: dbHealthy,
    data: {
      timestamp: new Date().toISOString(),
      services,
      performance: {
        activeConnections: pickNumber(activeSessions, 'count'),
        signaturesGenerated: pickNumber(today, 'count'),
        avgResponseTime: Math.round(pickNumber(execStats, 'avg_duration_ms')),
        requestsPerSecond,
        errorRate,
        memoryUsage,
        cpuUsage: 0
      },
      security: {
        // We don't track these signals yet; honest zero beats fake number.
        trustTransactions: 0,
        failedAuthentications: 0,
        compromisedAgents: 0,
        quantumThreats: 0
      },
      business: {
        registeredAgents: pickNumber(agentCounts, 'total'),
        activeAgents: pickNumber(agentCounts, 'active'),
        credentialsIssued: pickNumber(credCount, 'count'),
        auditEvents: pickNumber(auditCount, 'count')
      }
    }
  };
}
