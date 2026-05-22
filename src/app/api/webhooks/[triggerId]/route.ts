import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/workflows/execute';
import { findWebhookTrigger, markTriggerFired } from '@/lib/workflows/triggers';

export const dynamic = 'force-dynamic';

/**
 * Public webhook ingress. The path parameter is the trigger's UUID, which
 * serves as the URL-as-token secret (unguessable; rotate by deleting and
 * recreating the trigger). When a request arrives:
 *   1. Look up an enabled webhook trigger by id.
 *   2. Run the trigger's workflow as the workflow owner.
 *   3. Bump last_triggered / trigger_count.
 *
 * The request body (parsed as JSON if Content-Type allows, otherwise text)
 * is forwarded as `triggerInput` so action nodes can read it.
 *
 * This route is in middleware.ts publicRoutes (`/api/webhooks`) so it works
 * without a session.
 */
export async function POST(request: NextRequest, { params }: { params: { triggerId: string } }) {
  return handleWebhook(request, params.triggerId);
}
// Accept GET too — some webhook senders only do GET; keeps the door open.
export async function GET(request: NextRequest, { params }: { params: { triggerId: string } }) {
  return handleWebhook(request, params.triggerId);
}

async function handleWebhook(request: NextRequest, triggerId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(triggerId)) {
    return NextResponse.json({ error: 'Invalid trigger id' }, { status: 404 });
  }
  const found = await findWebhookTrigger(triggerId);
  if (!found) {
    // Same response for "not found" and "disabled" so callers can't enumerate.
    return NextResponse.json({ error: 'Webhook not found or disabled' }, { status: 404 });
  }

  if (!found.workflowOwner) {
    return NextResponse.json({ error: 'Workflow has no owner' }, { status: 500 });
  }

  // Best-effort payload parse — JSON when possible, text fallback, never throw.
  let payload: unknown = null;
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (request.headers.get('content-length')) {
      payload = await request.text();
    }
  } catch {
    payload = null;
  }

  try {
    const result = await runWorkflow(
      found.trigger.workflowId,
      { userId: found.workflowOwner, isFounder: false },
      {
        triggerType: 'webhook',
        triggerInput: {
          triggerId,
          triggerName: found.trigger.name,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          payload
        }
      }
    );
    await markTriggerFired(triggerId);
    return NextResponse.json({
      accepted: true,
      executionId: result.executionId,
      status: result.status
    });
  } catch (err) {
    console.error('[api/webhooks]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Run failed' },
      { status: 500 }
    );
  }
}
