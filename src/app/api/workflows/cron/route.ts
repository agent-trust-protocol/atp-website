import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow } from '@/lib/workflows/execute';
import { listDueScheduleTriggers, markTriggerFired } from '@/lib/workflows/triggers';

export const dynamic = 'force-dynamic';

/**
 * Cron entry-point. Finds schedule triggers whose interval has elapsed
 * and runs each one sequentially. Capped at 50 firings per tick.
 *
 * Invocation: Vercel Hobby caps cron frequency to once-per-day, which is
 * useless for sub-daily schedule triggers. So Vercel auto-cron is OFF by
 * default — invoke this endpoint from any external scheduler instead:
 *
 *   - cron-job.org / EasyCron / GitHub Actions schedule workflow
 *   - On Vercel Pro, add to vercel.json:
 *       "crons": [{ "path": "/api/workflows/cron", "schedule": "* * * * *" }]
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` required in production
 * (Vercel cron sends this automatically; external schedulers must set it).
 * Dev runs without the header.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  if (cronSecret) {
    if (auth !== `Bearer ${cronSecret}` && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('[cron] CRON_SECRET not set in production; allowing unauthenticated tick');
  }

  const due = await listDueScheduleTriggers(50);
  const results: Array<{ triggerId: string; workflowId: string; status: 'success' | 'failed' | 'error'; error?: string; executionId?: string }> = [];

  for (const t of due) {
    if (!t.created_by) {
      results.push({ triggerId: t.id, workflowId: t.workflow_id, status: 'error', error: 'workflow has no owner' });
      continue;
    }
    try {
      const r = await runWorkflow(
        t.workflow_id,
        { userId: t.created_by, isFounder: false },
        { triggerType: 'schedule', triggerInput: { triggerId: t.id, triggerName: t.name, configuration: t.configuration } }
      );
      await markTriggerFired(t.id);
      results.push({ triggerId: t.id, workflowId: t.workflow_id, status: r.status, executionId: r.executionId });
    } catch (err) {
      results.push({
        triggerId: t.id,
        workflowId: t.workflow_id,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({ processed: results.length, results, timestamp: new Date().toISOString() });
}
