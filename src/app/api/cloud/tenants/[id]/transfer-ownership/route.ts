import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { transferOwnership } from '@/lib/tenants/db';
import { recordAuditEvent } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/cloud/tenants/[id]/transfer-ownership
 *
 * Body: { newOwnerUserId: string }
 *
 * Atomically demote the current owner to admin and promote the
 * target user to owner. Only the current owner (or founder) can
 * call this. Target user must already be a tenant member.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

  const newOwnerUserId = typeof body.newOwnerUserId === 'string' ? body.newOwnerUserId.trim() : '';
  if (!newOwnerUserId) {
    return NextResponse.json(
      { error: 'newOwnerUserId is required.' },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const result = await transferOwnership(params.id, newOwnerUserId, actor);
    if (!result.ok) {
      const status = result.reason?.startsWith('Tenant')
        ? 404
        : result.reason?.startsWith('Target user')
          ? 404
          : 403;
      return NextResponse.json({ error: result.reason ?? 'Failed' }, { status, headers: NO_STORE });
    }
    await recordAuditEvent(actor, {
      entityType: 'tenant',
      entityId: params.id,
      action: 'transfer_ownership',
      changes: { newOwnerUserId, previousOwnerUserId: actor.userId },
      request
    });
    return NextResponse.json({ transferred: true, newOwnerUserId }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/transfer-ownership]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}
