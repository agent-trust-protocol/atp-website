import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listExecutions, executionToApi } from '@/lib/workflows/run';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? undefined;
  const limit = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);

  const rows = await listExecutions(viewer, { state, limit: Number.isFinite(limit) ? limit : 50 });
  return NextResponse.json({
    executions: rows.map(executionToApi),
    count: rows.length,
    timestamp: new Date().toISOString()
  });
}
