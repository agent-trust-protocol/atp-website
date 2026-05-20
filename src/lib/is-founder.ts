/**
 * Founder identity check. The founder bypasses every paywall, auth gate, and
 * "coming soon" placeholder so they can verify the live product end-to-end
 * without being blocked by their own gating. Identity is the Better Auth
 * session email matched against the server-only FOUNDER_EMAIL env var.
 */

export function isFounderEmail(email: string | null | undefined): boolean {
  const founder = process.env.FOUNDER_EMAIL;
  if (!email || !founder) return false;
  return email.trim().toLowerCase() === founder.trim().toLowerCase();
}

export function isFounderSession(session: { user?: { email?: string | null } | null } | null | undefined): boolean {
  return isFounderEmail(session?.user?.email);
}
