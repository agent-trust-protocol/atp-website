import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  getTenant,
  updateTenant,
  deleteTenant,
  toApiShape,
  isTenantPlan,
  isTenantStatus,
  isTenantTrustLevel,
  NotFound
} from '@/lib/tenants/store';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
    { status: 401 }
  );
}
function notFound() {
  return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();
  const row = await getTenant(viewer, params.id);
  if (!row) return notFound();
  return NextResponse.json({ tenant: toApiShape(row) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const row = await updateTenant(viewer, params.id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      status: isTenantStatus(body.status) ? body.status : undefined,
      plan: isTenantPlan(body.plan) ? body.plan : undefined,
      trustLevel: isTenantTrustLevel(body.trustLevel) ? body.trustLevel : undefined
    });
    return NextResponse.json({ tenant: toApiShape(row) });
  } catch (error) {
    if (error instanceof NotFound) return notFound();
    console.error('[tenants] update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant', details: error instanceof Error ? error.message : 'Unknown error' },
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
  const ok = await deleteTenant(viewer, params.id);
  if (!ok) return notFound();
  return NextResponse.json({ deleted: true, id: params.id });
}
