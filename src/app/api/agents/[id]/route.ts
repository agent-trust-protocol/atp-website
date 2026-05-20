import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents/store';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(req.headers);
  const agent = await getAgent(params.id, viewer);
  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return NextResponse.json(agent, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
