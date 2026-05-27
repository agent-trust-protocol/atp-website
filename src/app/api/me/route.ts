import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me — minimal identity endpoint. Returns who the request is
 * authenticated as plus whether they're the founder. Used by client code
 * (founder-mode badge, diagnostic page, conditional UI) and by humans
 * debugging why a session isn't picking up the founder bypass.
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  return NextResponse.json(
    {
      authenticated: viewer.userId !== null,
      userId: viewer.userId,
      email: viewer.email,
      isFounder: viewer.isFounder,
      founderEmailConfigured: Boolean(process.env.FOUNDER_EMAIL)
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
