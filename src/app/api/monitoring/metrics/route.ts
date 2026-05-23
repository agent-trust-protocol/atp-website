import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth, createDemoResponse } from '@/lib/api-auth';
import { computeMonitoringSnapshot } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
} as const;

/**
 * GET /api/monitoring/metrics
 *
 * Replaces the previous proxy to an external `ATP_MONITORING_URL` service
 * that never existed in production. Aggregates real numbers from our own
 * Postgres data (sessions, workflow_executions, agents, api_keys,
 * audit_logs) into the same response shape the proxy advertised, so the
 * existing `PerformanceMetricsPreview` keeps working with no client
 * changes — the numbers are just real now.
 */
export async function GET(request: NextRequest) {
  const authResult = await checkApiAuth(request);
  if (!authResult.isAuthenticated) {
    return authResult.error ?? createDemoResponse('metrics');
  }
  try {
    const snapshot = await computeMonitoringSnapshot();
    return NextResponse.json(snapshot, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/monitoring/metrics]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
