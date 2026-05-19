import { NextRequest, NextResponse } from 'next/server';
import { createAgent, type TrustTier } from '@/lib/demo-agents';

const VALID_TIERS: TrustTier[] = ['untrusted', 'basic', 'verified', 'premium', 'enterprise'];

/**
 * POST /api/agents/onboard
 *
 * Creates a new agent in the demo dashboard's in-memory store and
 * returns the created record.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    );
  }

  const trustLevel =
    typeof body.trustLevel === 'string' && (VALID_TIERS as string[]).includes(body.trustLevel)
      ? (body.trustLevel as TrustTier)
      : undefined;

  const agent = createAgent({
    name,
    did: typeof body.did === 'string' ? body.did : undefined,
    organization: typeof body.organization === 'string' ? body.organization : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    trustLevel
  });

  return NextResponse.json(agent, { status: 201 });
}
