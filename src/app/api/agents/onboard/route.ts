import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  createAgent as createPersistedAgent,
  isTrustTier,
  toApiShape,
  NotAuthorized,
  type TrustTier
} from '@/lib/agents/store';
import { createAgent as createDemoAgent } from '@/lib/demo-agents';

/**
 * POST /api/agents/onboard
 *
 * Authenticated viewer: persists the agent to Postgres scoped to the
 * caller. Anonymous viewer: falls through to the in-memory demo store
 * so the public marketing onboard flow still works end-to-end without
 * forcing signup.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const trustLevel: TrustTier | undefined = isTrustTier(body.trustLevel) ? body.trustLevel : undefined;
  const input = {
    name,
    did: typeof body.did === 'string' ? body.did : undefined,
    organization: typeof body.organization === 'string' ? body.organization : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    trustLevel
  };

  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    const demo = createDemoAgent(input);
    return NextResponse.json(demo, { status: 201 });
  }

  try {
    const row = await createPersistedAgent(viewer, input);
    return NextResponse.json(toApiShape(row), { status: 201 });
  } catch (error) {
    if (error instanceof NotAuthorized) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[agents] onboard failed:', error);
    return NextResponse.json(
      { error: 'Failed to create agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
