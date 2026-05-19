import { NextResponse } from 'next/server';
import { getAgent } from '@/lib/demo-agents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const agent = getAgent(params.id);
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
