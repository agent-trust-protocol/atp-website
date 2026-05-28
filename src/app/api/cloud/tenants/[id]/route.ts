import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { deleteTenant, getTenantById } from '@/lib/tenants/db';
import { recordAuditEvent } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };
  try {
    const tenant = await getTenantById(params.id, viewer);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(tenant, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to delete a tenant.' }, { status: 401, headers: NO_STORE });
  }
  const viewer = {
    userId: session.user.id,
    isFounder: isFounderSession(session)
  };
  try {
    const ok = await deleteTenant(params.id, viewer);
    if (!ok) {
      return NextResponse.json(
        { error: 'Tenant not found or you are not the owner' },
        { status: 404, headers: NO_STORE }
      );
    }
    await recordAuditEvent(viewer, {
      entityType: 'tenant',
      entityId: params.id,
      action: 'delete',
      request
    });
    return NextResponse.json({ deleted: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
