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

  try {
    const rows = await listExecutions(viewer, { state: 'running', limit: 100 });
    const executions = rows.map(executionToApi);
    return NextResponse.json({
      executions,
      count: executions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[workflows/executions/active] failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active executions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
