import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/lib/agents/store';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const viewer = await getViewer(req.headers);
  const agents = await listAgents(viewer);
  return NextResponse.json(
    { agents },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
