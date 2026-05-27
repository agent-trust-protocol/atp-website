import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  listTenants,
  createTenant,
  toApiShape,
  isTenantPlan,
  isTenantTrustLevel,
  NotAuthorized,
  DomainTaken
} from '@/lib/tenants/store';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json(
    { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
    { status: 401 }
  );
}

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) return unauthorized();

  const rows = await listTenants(viewer);
  return NextResponse.json({ tenants: rows.map(toApiShape), total: rows.length });
}

export async function POST(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Tenant name is required' }, { status: 400 });
  }

  try {
    const row = await createTenant(viewer, {
      name: body.name,
      domain: typeof body.domain === 'string' ? body.domain : undefined,
      plan: isTenantPlan(body.plan) ? body.plan : undefined,
      trustLevel: isTenantTrustLevel(body.trustLevel) ? body.trustLevel : undefined
    });
    return NextResponse.json({ tenant: toApiShape(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof NotAuthorized) return unauthorized();
    if (error instanceof DomainTaken) {
      return NextResponse.json({ error: error.message, code: 'DOMAIN_TAKEN' }, { status: 409 });
    }
    console.error('[tenants] create failed:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
