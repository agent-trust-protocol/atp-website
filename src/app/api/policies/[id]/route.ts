import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  getPolicy,
  upsertPolicy,
  deletePolicy,
  toApiShape,
  NotFound,
  NotAuthorized
} from '@/lib/policies/store';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
    { status: 401 }
  );
}
function notFound() {
  return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();
  const row = await getPolicy(viewer, params.id);
  if (!row) return notFound();
  return NextResponse.json({ policy: toApiShape(row) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) return unauthorized();

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const row = await upsertPolicy(viewer, params.id, body);
    return NextResponse.json({ policy: toApiShape(row) });
  } catch (error) {
    if (error instanceof NotAuthorized) return unauthorized();
    if (error instanceof NotFound) return notFound();
    console.error('[policies] upsert failed:', error);
    return NextResponse.json(
      { error: 'Failed to save policy', details: error instanceof Error ? error.message : 'Unknown error' },
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
  const ok = await deletePolicy(viewer, params.id);
  if (!ok) return notFound();
  return NextResponse.json({ deleted: true, id: params.id });
}
