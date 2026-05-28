import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getOrCreateTenantForUser } from '@/lib/tenants/db';
import TenantSetupForm from './TenantSetupForm';

export const dynamic = 'force-dynamic';

/**
 * Tenant init / rename — single page for both flows. We keep the 1:1
 * tenant model for now, so this page either:
 *   1. provisions the user's first tenant via the form (new account), or
 *   2. lets them rename / re-slug the tenant they already have.
 *
 * `getOrCreateTenantForUser` is idempotent — calling it here makes both
 * paths share one code path: the form is always pre-filled with the
 * current name + slug, and POSTing applies any deltas. When multi-org
 * lands, this page sprouts a "Create another tenant" branch above the
 * form.
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

  // Detect "this user already had a tenant before today" — controls the
  // banner copy in the form (initial setup vs editing).
  const isInitialSetup =
    new Date(tenant.createdAt).getTime() > Date.now() - 60_000 &&
    tenant.name === (session.user.name || session.user.email || tenant.name);

  return (
    <TenantSetupForm
      tenantId={tenant.id}
      initialName={tenant.name}
      initialSlug={tenant.slug}
      isInitialSetup={isInitialSetup}
    />
  );
}
