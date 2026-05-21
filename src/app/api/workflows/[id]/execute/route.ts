import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { runWorkflow } from '@/lib/workflows/execute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/workflows/[id]/execute
 *
 * Synchronously runs the workflow and returns the execution id + summary.
 * Sign-in required; the viewer must own the workflow (founder bypass).
 *
 * Body is optional; whatever is passed becomes `inputs.__trigger` for every
 * trigger node. PR #41 adds non-manual trigger types.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Sign in to run a workflow.' },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: Record<string, unknown> = {};
  if (request.headers.get('content-length')) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
    }
  }

  try {
    const result = await runWorkflow(params.id, viewer, {
      triggerType: 'manual',
      triggerInput: body.triggerInput ?? body
    });
    return NextResponse.json(result, { status: 200, headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const code = message === 'Workflow not found' ? 404
      : message === 'Not permitted to run this workflow' ? 403
      : 500;
    if (code === 500) console.error('[api/workflows/:id/execute]', error);
    return NextResponse.json({ error: message }, { status: code, headers: NO_STORE });
  }
}
