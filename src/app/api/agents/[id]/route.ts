import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { getAgent, deleteAgent, toApiShape } from '@/lib/agents/store';
import { getAgent as getDemoAgent } from '@/lib/demo-agents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const noStore = { 'Cache-Control': 'no-store' } as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);

  // Anonymous viewer: serve the synthetic demo agents so public
  // dashboard deep-links keep working.
  if (!viewer.userId && !viewer.isFounder) {
    const demo = getDemoAgent(params.id);
    if (!demo) return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: noStore });
    return NextResponse.json(demo, { headers: noStore });
  }

  const row = await getAgent(viewer, params.id);
  if (!row) return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: noStore });
  return NextResponse.json(toApiShape(row), { headers: noStore });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401, headers: noStore }
    );
  }
  const ok = await deleteAgent(viewer, params.id);
  if (!ok) return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: noStore });
  return NextResponse.json({ deleted: true, id: params.id }, { headers: noStore });
}
