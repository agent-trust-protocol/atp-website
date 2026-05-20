import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getOrCreateTenantForUser, listTenantsForViewer, renameTenant } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  try {
    // Auto-provision on first read for signed-in users. Idempotent.
    if (session?.user) {
      await getOrCreateTenantForUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null
      });
    }
    const tenants = await listTenantsForViewer(viewer);
    return NextResponse.json(
      { tenants, total: tenants.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/cloud/tenants GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

/**
 * POST today renames the caller's tenant. Creating additional tenants is
 * deferred — the 1:1 model means one tenant per user. When multi-org
 * lands, this is where the "create a second tenant" branch will live.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Sign in to update your tenant.' },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Tenant name is required' }, { status: 400, headers: NO_STORE });
  }

  try {
    // Find (or create) the caller's tenant, then rename it.
    const tenant = await getOrCreateTenantForUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null
    });
    const updated = await renameTenant(
      tenant.id,
      name,
      { userId: session.user.id, isFounder: isFounderSession(session) }
    );
    if (!updated) {
      return NextResponse.json({ error: 'Tenant not found or no permission' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ tenant: updated }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants POST]', error);
    return NextResponse.json(
      { error: 'Failed to update tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
