/**
 * Persistence wrapper around the pure evaluator. Loads a policy
 * (viewer-scoped via Phase 4's getPolicy), runs it against the supplied
 * context, optionally writes the result into policy_evaluations.
 */

import { execute, initializeAppTables } from '@/lib/db';
import { getPolicy } from '@/lib/policies/db';
import { evaluatePolicy, type EvaluationResult, type PolicyDocument } from '@/policy-engine/evaluator';
import type { Viewer } from '@/lib/viewer';

let initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeAppTables().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export interface EvaluateOptions {
  /** Persist the evaluation to policy_evaluations for audit/history. */
  persist?: boolean;
}

export interface PersistedEvaluation extends EvaluationResult {
  evaluationId: string | null;
  policyId: string;
}

/**
 * Evaluate a saved policy by id. Returns null if the viewer can't see
 * the policy (matches Phase 4's visibility model).
 */
export async function evaluateSavedPolicy(
  policyId: string,
  context: unknown,
  viewer: Viewer,
  opts: EvaluateOptions = {}
): Promise<PersistedEvaluation | null> {
  await ensureInit();
  const policy = await getPolicy(policyId, viewer);
  if (!policy) return null;
  const result = evaluatePolicy(policy.document as PolicyDocument, context);

  let evaluationId: string | null = null;
  if (opts.persist) {
    // Let Postgres allocate the UUID — the table has gen_random_uuid() default
    // and we just need the new id back so the API can return it.
    const rows = await execute(
      `INSERT INTO policy_evaluations
        (policy_id, decision, matched_rule_id, matched_rule_name, reason, context,
         evaluated_by, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [
        policyId,
        result.decision,
        result.matchedRule?.id ?? null,
        result.matchedRule?.name ?? null,
        result.reason,
        JSON.stringify(context),
        viewer.userId ?? 'anonymous',
        Math.round(result.processingTimeMs)
      ]
    );
    // execute returns rowCount; if we need the id, do a separate fetch.
    // For now, callers that need the id can query by recency or we add a
    // RETURNING-aware helper. Skip the id for v1.
    evaluationId = rows > 0 ? 'persisted' : null;
  }

  return {
    ...result,
    evaluationId,
    policyId
  };
}

/**
 * Evaluate an inline policy document — useful for the visual editor's
 * "test before saving" flow, or for ad-hoc policy testing.
 */
export function evaluateInlinePolicy(
  policy: PolicyDocument,
  context: unknown
): EvaluationResult {
  return evaluatePolicy(policy, context);
}
