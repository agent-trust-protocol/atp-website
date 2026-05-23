import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * GET /api/admin/diagnostic
 *
 * Self-diagnostic for the founder bypass. Returns enough info for a human
 * to figure out why founder mode isn't kicking in, without leaking the
 * configured FOUNDER_EMAIL value to clients. Intended to be rendered by
 * /admin/diagnostic — but safe to hit directly.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const founderEmail = (process.env.FOUNDER_EMAIL ?? '').trim();
  const founderEmailConfigured = founderEmail.length > 0;

  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? null;
  const founderEmailLc = founderEmail.toLowerCase();
  const emailMatches = !!sessionEmail && !!founderEmailLc && sessionEmail === founderEmailLc;

  // Hint string — tells the viewer WHY isFounder is false (without leaking
  // the configured value).
  let hint: string;
  if (!session?.user) {
    hint = 'You are not signed in. Sign in via /admin/login.';
  } else if (!founderEmailConfigured) {
    hint = 'FOUNDER_EMAIL env var is not set on this deployment. Set it in Vercel project settings, redeploy, then re-check.';
  } else if (!emailMatches) {
    hint = 'You are signed in, but the email on your session does not match FOUNDER_EMAIL. Sign in with the founder account, or update FOUNDER_EMAIL to match.';
  } else {
    hint = 'Founder bypass is active. All paywalls and gates should open for you.';
  }

  return NextResponse.json(
    {
      authenticated: !!session?.user,
      user: session?.user
        ? { id: session.user.id, email: session.user.email, name: session.user.name ?? null }
        : null,
      isFounder: isFounderSession(session),
      checks: {
        founderEmailConfigured,
        sessionEmailPresent: !!sessionEmail,
        emailMatches
      },
      hint
    },
    { headers: NO_STORE }
  );
}
