import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { headers as nextHeaders } from 'next/headers';
import { createInvitation, listInvitations } from '@/lib/tenants/db';
import { recordAuditEvent } from '@/lib/audit/log';
import { emailService } from '@/lib/email';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const invitations = await listInvitations(params.id, viewer);
    if (invitations === null) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ invitations }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/invitations GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}

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

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400, headers: NO_STORE });
  }
  const role = body.role === 'admin' ? 'admin' : 'member';

  try {
    const invitation = await createInvitation(params.id, { email, role }, actor);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Tenant not found or you are not permitted to invite.' },
        { status: 403, headers: NO_STORE }
      );
    }

    // Build the absolute URL for the email. `host` comes from the request
    // headers — in production this is the canonical domain.
    const h = await nextHeaders();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'agenttrustprotocol.com';
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const inviteUrl = `${proto}://${host}/invitations/${invitation.token}`;

    // Best-effort email — failure doesn't block the API response. The
    // inviter can always copy/paste the URL from the response or the
    // invitations list.
    const inviterName = session.user.name || session.user.email || 'a teammate';
    const tenantName = invitation.tenantName || 'an ATP tenant';
    const sent = await emailService.sendEmail({
      to: invitation.email,
      subject: `${inviterName} invited you to ${tenantName} on Agent Trust Protocol`,
      html: `
        <h2>You've been invited to ${tenantName}</h2>
        <p><strong>${inviterName}</strong> invited you to join their tenant on Agent Trust Protocol as a <strong>${invitation.role}</strong>.</p>
        <p>Click the link below to accept (you'll be asked to sign in first if you aren't already):</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px">Accept invitation</a></p>
        <p style="color:#888;font-size:12px;margin-top:24px">
          This invitation expires on ${new Date(invitation.expiresAt).toLocaleString()}.
          If you weren't expecting this, you can ignore this email.
        </p>
        <p style="color:#888;font-size:11px;font-family:monospace">${inviteUrl}</p>
      `,
      replyTo: session.user.email ?? undefined
    });

    await recordAuditEvent(actor, {
      entityType: 'tenant_invitation',
      entityId: invitation.id,
      action: 'create',
      changes: { email: invitation.email, role: invitation.role },
      metadata: { tenantId: params.id, emailSent: sent },
      request
    });

    return NextResponse.json(
      { invitation, inviteUrl, emailSent: sent },
      { status: 201, headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/cloud/tenants/:id/invitations POST]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500, headers: NO_STORE }
    );
  }
}
