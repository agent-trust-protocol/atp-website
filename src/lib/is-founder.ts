/**
 * Founder bypass — a single env-configured email gets unrestricted access
 * to viewer-scoped data (sees all users' rows, not just their own). Used by
 * `Viewer` and admin pages. Returns false when FOUNDER_EMAIL is unset so
 * deployments without the env var fail closed.
 */

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const founder = process.env.FOUNDER_EMAIL?.trim().toLowerCase();
  if (!founder) return false;
  return email.trim().toLowerCase() === founder;
}

export function isFounderSession(session: { user?: { email?: string | null } | null } | null | undefined): boolean {
  return isFounderEmail(session?.user?.email);
}
