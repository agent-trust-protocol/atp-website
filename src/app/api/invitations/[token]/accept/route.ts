import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptInvitation, getInvitationByToken } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/invitations/[token]/accept
 *
 * Accept a tenant invitation as the signed-in user. The acceptor's
 * email must match the invitation's email (case-insensitive).
 *
 * GET on the same URL returns invitation details so the public accept
 * page can render a confirm screen.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Sign in to accept this invitation.' },
      { status: 401, headers: NO_STORE }
    );
  }
  if (!session.user.email) {
    return NextResponse.json(
      { error: 'Your account has no email; cannot match invitation.' },
      { status: 400, headers: NO_STORE }
    );
  }
  try {
    const result = await acceptInvitation(params.token, {
      id: session.user.id,
      email: session.user.email
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason ?? 'Accept failed' },
        { status: 400, headers: NO_STORE }
      );
    }
    return NextResponse.json({ accepted: true, tenantId: result.tenantId }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/invitations/:token/accept]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await getInvitationByToken(params.token);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404, headers: NO_STORE });
    }
    // Hide token + invitedBy in the response — token is the secret;
    // invitedBy could doxx the inviter to a non-recipient.
    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          tenantId: invitation.tenantId,
          tenantName: invitation.tenantName,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        }
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/invitations/:token GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}
