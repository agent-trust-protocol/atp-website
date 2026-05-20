import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getTenantById } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

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
    const tenant = await getTenantById(params.id, viewer);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(tenant, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
