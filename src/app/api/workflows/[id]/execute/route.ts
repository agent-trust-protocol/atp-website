import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { runWorkflow, NotFound, NotAuthorized } from '@/lib/workflows/run';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401 }
    );
  }

  let body: any = {};
  if (request.headers.get('content-length') && request.headers.get('content-length') !== '0') {
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  try {
    const outcome = await runWorkflow(viewer, params.id, {
      initialData: body?.initialData && typeof body.initialData === 'object' ? body.initialData : {}
    });
    const status = outcome.state === 'completed' ? 200 : 422;
    return NextResponse.json(outcome, { status });
  } catch (error) {
    if (error instanceof NotAuthorized) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFound) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    console.error('[workflows/execute] failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
