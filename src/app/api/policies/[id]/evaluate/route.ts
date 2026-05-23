import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { evaluateSavedPolicy } from '@/lib/policies/evaluate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * POST /api/policies/[id]/evaluate
 *
 * Body: { context: object, persist?: boolean }
 *
 * Synchronously runs the saved policy against the supplied context and
 * returns the evaluator's verdict (decision + matchedRule + reason +
 * processingTimeMs). Persisted to policy_evaluations when `persist` is
 * true; the testing UI sends it as `false` to avoid noise from scenarios.
 *
 * Viewer scoping is the same as Phase 4's policy reads: owner-or-founder
 * can evaluate a policy they can see.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json({ error: 'Sign in to evaluate policies.' }, { status: 401, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  // Accept either { context: {...} } (canonical) or a flat object (lenient).
  const context = body.context && typeof body.context === 'object' ? body.context : body;
  const persist = body.persist === true;

  try {
    const result = await evaluateSavedPolicy(params.id, context, viewer, { persist });
    if (!result) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/policies/:id/evaluate]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Evaluation failed' },
      { status: 500, headers: NO_STORE }
    );
  }
}
