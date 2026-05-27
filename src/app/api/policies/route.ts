import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  listPolicies,
  createPolicy,
  toApiShape,
  NotAuthorized
} from '@/lib/policies/store';

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

  const rows = await listPolicies(viewer);
  return NextResponse.json({ policies: rows.map(toApiShape), total: rows.length });
}

export async function POST(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) return unauthorized();

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const row = await createPolicy(viewer, body);
    return NextResponse.json({ policy: toApiShape(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof NotAuthorized) return unauthorized();
    console.error('[policies] create failed:', error);
    return NextResponse.json(
      { error: 'Failed to create policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
