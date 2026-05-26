import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listPolicyEvaluations } from '@/lib/policies/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * GET /api/policies/evaluations
 *
 * Lists recent policy_evaluations the viewer is allowed to see — owner's
 * policies for normal users, all of them for the founder. Query params:
 *   - policyId  (UUID, optional)  → filter to one policy
 *   - limit     (1-200, default 50)
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  const url = new URL(request.url);
  const policyId = url.searchParams.get('policyId') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : undefined;

  try {
    const evaluations = await listPolicyEvaluations(viewer, { policyId, limit });
    return NextResponse.json(
      { evaluations, total: evaluations.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/policies/evaluations]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
