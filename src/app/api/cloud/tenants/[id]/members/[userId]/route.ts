import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { removeTenantMember, setMemberRole } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * DELETE /api/cloud/tenants/[id]/members/[userId]
 *
 * Remove a member from a tenant. Owner-or-founder only. Owners cannot
 * be removed via this path (transfer ownership or delete the tenant
 * instead).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }
  const actor = {
    userId: session.user.id,
    isFounder: isFounderSession(session)
  };
  try {
    const result = await removeTenantMember(params.id, params.userId, actor);
    if (!result.ok) {
      const status = result.reason?.startsWith('Tenant') || result.reason?.startsWith('Member') ? 404 : 403;
      return NextResponse.json({ error: result.reason ?? 'Failed' }, { status, headers: NO_STORE });
    }
    return NextResponse.json({ removed: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/members/:userId DELETE]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500, headers: NO_STORE }
    );
  }
}

/**
 * PUT /api/cloud/tenants/[id]/members/[userId]
 *
 * Change a member's role (admin | member). Owner-or-founder only.
 * The owner's role cannot be changed via this endpoint — use
 * /api/cloud/tenants/[id]/transfer-ownership instead.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }
  const actor = {
    userId: session.user.id,
    isFounder: isFounderSession(session)
  };

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  const role = body.role === 'admin' || body.role === 'member' ? body.role : null;
  if (!role) {
    return NextResponse.json(
      { error: 'role must be "admin" or "member".' },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const result = await setMemberRole(params.id, params.userId, role, actor);
    if (!result.ok) {
      const status = result.reason?.startsWith('Tenant') || result.reason?.startsWith('Member')
        ? 404
        : 403;
      return NextResponse.json({ error: result.reason ?? 'Failed' }, { status, headers: NO_STORE });
    }
    return NextResponse.json({ role }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/members/:userId PUT]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change role' },
      { status: 500, headers: NO_STORE }
    );
  }
}
