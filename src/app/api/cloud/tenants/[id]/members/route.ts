import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { listTenantMembers } from '@/lib/tenants/db';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * GET /api/cloud/tenants/[id]/members
 *
 * Lists members of a tenant. Visible to anyone who is themselves a
 * member, plus the founder. Returns null/404 for unrelated viewers.
 */
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
    const members = await listTenantMembers(params.id, viewer);
    if (members === null) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ members }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/cloud/tenants/:id/members GET]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list members' },
      { status: 500, headers: NO_STORE }
    );
  }
}
