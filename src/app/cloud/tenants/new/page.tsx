import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getOrCreateTenantForUser } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';

/**
 * Under the 1:1 tenant model (Phase 3a), each user gets exactly one tenant.
 * "Create new" therefore reduces to "make sure you have one, then take me
 * to it" — the existing auto-provision in `getOrCreateTenantForUser` is
 * idempotent so this works for both first-time and returning users.
 *
 * When multi-org lands (Phase 3b), this page becomes a real form.
 */
export default async function NewTenantPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) {
    redirect('/login?returnTo=/cloud/tenants/new');
  }
  const tenant = await getOrCreateTenantForUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null
  });
  redirect(`/cloud/tenants/${tenant.id}`);
}
