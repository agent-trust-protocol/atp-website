import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { createTrigger, listTriggersForWorkflow, type TriggerType } from '@/lib/workflows/triggers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const VALID_TYPES: TriggerType[] = ['manual', 'schedule', 'webhook', 'event'];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  try {
    const triggers = await listTriggersForWorkflow(params.id, viewer);
    return NextResponse.json({ triggers }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Not permitted') ? 403 : message === 'Workflow not found' ? 404 : 500;
    if (status === 500) console.error('[api/workflows/:id/triggers GET]', error);
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  const type = typeof body.type === 'string' && (VALID_TYPES as string[]).includes(body.type)
    ? (body.type as TriggerType) : null;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!type) return NextResponse.json({ error: `type must be one of ${VALID_TYPES.join(', ')}` }, { status: 400, headers: NO_STORE });
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400, headers: NO_STORE });

  // Per-type configuration validation. Schedule needs intervalSeconds;
  // webhook is happy with {} (the row id IS the secret).
  const configuration = (typeof body.configuration === 'object' && body.configuration !== null
    ? body.configuration as Record<string, unknown>
    : {});
  if (type === 'schedule') {
    const interval = Number(configuration.intervalSeconds);
    if (!Number.isFinite(interval) || interval < 60) {
      return NextResponse.json(
        { error: 'schedule triggers require configuration.intervalSeconds (>= 60)' },
        { status: 400, headers: NO_STORE }
      );
    }
  }

  try {
    const trigger = await createTrigger(params.id, { type, name, configuration }, viewer);
    return NextResponse.json({ trigger }, { status: 201, headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Not permitted') ? 403 : message === 'Workflow not found' ? 404 : 500;
    if (status === 500) console.error('[api/workflows/:id/triggers POST]', error);
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
}
