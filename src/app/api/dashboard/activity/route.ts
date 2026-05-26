import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listActivity, type ActivitySource } from '@/lib/activity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const VALID_SOURCES: ActivitySource[] = [
  'policy_evaluation',
  'workflow_execution',
  'audit_log',
  'tenant_invitation'
];

/**
 * GET /api/dashboard/activity
 *
 * Query params:
 *   - source (one of: policy_evaluation | workflow_execution |
 *     audit_log | tenant_invitation). Omit for all.
 *   - limit  (1-200, default 100).
 *
 * Returns a single chronologically-sorted feed. Viewer-scoped:
 * anonymous → []; member → their own data; founder → everything.
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  const url = new URL(request.url);
  const sourceParam = url.searchParams.get('source');
  const source = sourceParam && (VALID_SOURCES as string[]).includes(sourceParam)
    ? (sourceParam as ActivitySource)
    : undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : undefined;

  try {
    const events = await listActivity(viewer, { source, limit });
    return NextResponse.json(
      { events, total: events.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/dashboard/activity]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
