import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listAgents, toApiShape } from '@/lib/agents/store';
import { listAgents as listDemoAgents } from '@/lib/demo-agents';

// The marketing dashboard is public and renders synthetic agents for
// unauthenticated viewers; once you sign in, you see the agents you
// actually own (or all of them if you're the founder).
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  const noStore = { 'Cache-Control': 'no-store' } as const;

  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json({ agents: listDemoAgents() }, { headers: noStore });
  }

  const rows = await listAgents(viewer);
  return NextResponse.json({ agents: rows.map(toApiShape) }, { headers: noStore });
}
