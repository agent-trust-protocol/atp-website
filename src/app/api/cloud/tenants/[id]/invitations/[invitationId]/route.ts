import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { revokeInvitation } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
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
    const ok = await revokeInvitation(params.invitationId, actor);
    if (!ok) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted/revoked.' },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json({ revoked: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/invitations/:invitationId DELETE]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}
