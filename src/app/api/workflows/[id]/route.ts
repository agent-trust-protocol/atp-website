import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toApiShape,
  NotFound
} from '@/lib/workflows/store';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
    { status: 401 }
  );
}

function notFound() {
  return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();

  const { id } = params;
  const row = await getWorkflow(viewer, id);
  if (!row) return notFound();
  return NextResponse.json({ workflow: toApiShape(row) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();

  const { id } = params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const row = await updateWorkflow(viewer, id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      status: body.status,
      nodes: Array.isArray(body.nodes) ? body.nodes : undefined,
      edges: Array.isArray(body.edges) ? body.edges : undefined,
      variables: body.variables && typeof body.variables === 'object' ? body.variables : undefined
    });
    return NextResponse.json({ workflow: toApiShape(row) });
  } catch (error) {
    if (error instanceof NotFound) return notFound();
    console.error('[workflows] update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();

  const { id } = params;
  const ok = await deleteWorkflow(viewer, id);
  if (!ok) return notFound();
  return NextResponse.json({ deleted: true, id });
}
