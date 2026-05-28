import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import {
  getOrCreateTenantForUser,
  listTenantsForViewer,
  renameTenant,
  renameTenantSlug,
  validateSlug,
  SlugTakenError,
  type Tenant
} from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  try {
    // Auto-provision on first read for signed-in users. Idempotent.
    if (session?.user) {
      await getOrCreateTenantForUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null
      });
    }
    const tenants = await listTenantsForViewer(viewer);
    return NextResponse.json(
      { tenants, total: tenants.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/cloud/tenants GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

/**
 * POST today renames the caller's tenant. Creating additional tenants is
 * deferred — the 1:1 model means one tenant per user. When multi-org
 * lands, this is where the "create a second tenant" branch will live.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Sign in to update your tenant.' },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Tenant name is required' }, { status: 400, headers: NO_STORE });
  }

  // Slug is optional on init/rename — if omitted we keep whatever's
  // there (auto-generated on first provision). When supplied we
  // normalize + validate up front so the user sees a clean error.
  const rawSlug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  if (rawSlug) {
    const slugError = validateSlug(rawSlug);
    if (slugError) {
      return NextResponse.json({ error: slugError, code: 'INVALID_SLUG' }, { status: 400, headers: NO_STORE });
    }
  }

  const viewer = { userId: session.user.id, isFounder: isFounderSession(session) };

  try {
    // Find (or create) the caller's tenant, then apply name + slug
    // updates. Idempotent on first-run for new users. We narrow to
    // `Tenant` (dropping the membership fields the join returns) once
    // we start chaining rename calls so the type matches.
    const base = await getOrCreateTenantForUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null
    });
    let updated: Tenant = {
      id: base.id,
      name: base.name,
      slug: base.slug,
      plan: base.plan,
      status: base.status,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt
    };

    if (updated.name !== name) {
      const renamed = await renameTenant(updated.id, name, viewer);
      if (!renamed) {
        return NextResponse.json({ error: 'Tenant not found or no permission' }, { status: 404, headers: NO_STORE });
      }
      updated = renamed;
    }

    if (rawSlug && rawSlug !== updated.slug) {
      try {
        const slugRenamed = await renameTenantSlug(updated.id, rawSlug, viewer);
        if (!slugRenamed) {
          return NextResponse.json({ error: 'Tenant not found or no permission' }, { status: 404, headers: NO_STORE });
        }
        updated = slugRenamed;
      } catch (err) {
        if (err instanceof SlugTakenError) {
          return NextResponse.json(
            { error: 'That subdomain is already in use.', code: 'SLUG_TAKEN' },
            { status: 409, headers: NO_STORE }
          );
        }
        throw err;
      }
    }

    return NextResponse.json({ tenant: updated }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants POST]', error);
    return NextResponse.json(
      { error: 'Failed to update tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
