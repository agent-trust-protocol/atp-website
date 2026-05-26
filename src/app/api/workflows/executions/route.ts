import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listExecutionsForViewer } from '@/lib/workflows/execute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * GET /api/workflows/executions
 *
 * Cross-workflow execution list, viewer-scoped. Symmetric with the
 * /api/policies/evaluations endpoint shipped in PR #57.
 *
 * Query params:
 *   - status (running | pending | queued | success | failed | cancelled)
 *   - limit  (1-200, default 50)
 *
 * The sibling /api/workflows/executions/active (Phase 2) only returns the
 * currently-running set; this one returns the full history.
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : undefined;

  try {
    const executions = await listExecutionsForViewer(viewer, { status, limit });
    return NextResponse.json(
      { executions, total: executions.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/workflows/executions]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
