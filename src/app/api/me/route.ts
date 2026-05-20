import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';

/**
 * Single source of truth for the client about "who am I and what can I see".
 * Returns the Better Auth session plus a derived `isFounder` flag so client
 * gates don't have to know the founder's email. Cache-busted so a fresh
 * sign-in is reflected immediately.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);

  if (!session?.user) {
    return NextResponse.json(
      { authenticated: false, user: null, isFounder: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null
      },
      isFounder: isFounderSession(session)
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
