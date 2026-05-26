import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { removeTenantMember } from '@/lib/tenants/db';

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
