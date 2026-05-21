import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { deletePolicy, getPolicy, updatePolicy } from '@/lib/policies/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  try {
    const policy = await getPolicy(params.id, viewer);
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(policy, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/policies/:id GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in to update a policy.' }, { status: 401, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  try {
    const updated = await updatePolicy(
      params.id,
      {
        name: typeof body.name === 'string' ? body.name : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        version: typeof body.version === 'string' ? body.version : undefined,
        document: body.document ?? undefined,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined
      },
      viewer
    );
    if (!updated) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ policy: updated }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/policies/:id PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in to delete a policy.' }, { status: 401, headers: NO_STORE });
  }
  try {
    const ok = await deletePolicy(params.id, viewer);
    if (!ok) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ deleted: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/policies/:id DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
