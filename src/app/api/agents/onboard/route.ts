import { NextRequest, NextResponse } from 'next/server';
import { createAgent, type TrustTier } from '@/lib/agents/store';
import { getViewer } from '@/lib/viewer';
import { recordAuditEvent } from '@/lib/audit/log';

const VALID_TIERS: TrustTier[] = ['untrusted', 'basic', 'verified', 'premium', 'enterprise'];

/**
 * POST /api/agents/onboard
 *
 * Creates a new agent owned by the signed-in user and returns the
 * persisted record. Sign-in is required — anonymous callers get 401.
 */
export async function POST(req: NextRequest) {
  const viewer = await getViewer(req.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Sign in to create an agent.' },
      { status: 401 }
    );
  }

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

  const agent = await createAgent(
    {
      name,
      did: typeof body.did === 'string' ? body.did : undefined,
      organization: typeof body.organization === 'string' ? body.organization : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      trustLevel
    },
    { userId: viewer.userId }
  );

  await recordAuditEvent(viewer, {
    entityType: 'agent',
    entityId: agent.id,
    action: 'create',
    changes: { name: agent.name, trustLevel: agent.trustLevel, did: agent.did },
    request: req
  });

  return NextResponse.json(agent, { status: 201 });
}
