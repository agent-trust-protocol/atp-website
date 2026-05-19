import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/demo-agents';

// In-memory store mutates on POST; opt out of every caching layer so the
// list always reflects the latest state. force-dynamic alone isn't enough
// in Next 14 prod — the full-route cache (.next/cache) still serves stale
// responses unless we also send Cache-Control: no-store.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(
    { agents: listAgents() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
