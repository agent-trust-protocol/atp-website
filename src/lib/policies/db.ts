/**
 * Postgres-backed policy store. Replaces the previous reliance on an
 * external atp-permission service (NEXT_PUBLIC_ATP_PERMISSION_URL) that
 * never existed in production. Persists the full policy IR in `document`
 * JSONB so the visual editor round-trips without a separate engine.
 *
 * Viewer model (matches agents/workflows/tenants):
 *   anonymous → []
 *   authenticated → policies they own
 *   founder → every policy
 *
 * Execution / simulation / evaluation still need an engine — out of scope.
 */

import { query, queryOne, execute, initializeAppTables } from '@/lib/db';
import type { Viewer } from '@/lib/agents/store';

export interface Policy {
  id: string;
  ownerUserId: string | null;
  name: string;
  description: string;
  version: string;
  document: unknown;
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PolicyRow {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string;
  version: string;
  document: unknown;
  enabled: boolean;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

function rowToPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    version: row.version,
    document: row.document,
    enabled: row.enabled,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPolicies(viewer: Viewer): Promise<Policy[]> {
  await ensureInit();
  if (viewer.isFounder) {
    const rows = await query<PolicyRow>(`SELECT * FROM policies ORDER BY created_at DESC`);
    return rows.map(rowToPolicy);
  }
  if (!viewer.userId) return [];
  const rows = await query<PolicyRow>(
    `SELECT * FROM policies WHERE owner_user_id = $1 ORDER BY created_at DESC`,
    [viewer.userId]
  );
  return rows.map(rowToPolicy);
}

export async function getPolicy(id: string, viewer: Viewer): Promise<Policy | null> {
  await ensureInit();
  if (!UUID_RE.test(id)) return null;
  const row = await queryOne<PolicyRow>(`SELECT * FROM policies WHERE id = $1`, [id]);
  if (!row) return null;
  if (!viewer.isFounder && row.owner_user_id !== viewer.userId) return null;
  return rowToPolicy(row);
}

export interface CreatePolicyInput {
  name: string;
  description?: string;
  version?: string;
  document: unknown;
  enabled?: boolean;
  tags?: string[];
}

export async function createPolicy(
  input: CreatePolicyInput,
  owner: { userId: string }
): Promise<Policy> {
  await ensureInit();
  const row = await queryOne<PolicyRow>(
    `INSERT INTO policies (owner_user_id, name, description, version, document, enabled, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      owner.userId,
      input.name,
      input.description ?? '',
      input.version ?? '1.0.0',
      JSON.stringify(input.document),
      input.enabled ?? true,
      JSON.stringify(input.tags ?? [])
    ]
  );
  if (!row) throw new Error('Policy insert returned no row');
  return rowToPolicy(row);
}

export interface UpdatePolicyInput {
  name?: string;
  description?: string;
  version?: string;
  document?: unknown;
  enabled?: boolean;
  tags?: string[];
}

export async function updatePolicy(
  id: string,
  input: UpdatePolicyInput,
  viewer: Viewer
): Promise<Policy | null> {
  await ensureInit();
  const existing = await getPolicy(id, viewer);
  if (!existing) return null;
  const next: Required<UpdatePolicyInput> = {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    version: input.version ?? existing.version,
    document: input.document ?? existing.document,
    enabled: input.enabled ?? existing.enabled,
    tags: input.tags ?? existing.tags
  };
  const row = await queryOne<PolicyRow>(
    `UPDATE policies
       SET name = $1, description = $2, version = $3, document = $4,
           enabled = $5, tags = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      next.name,
      next.description,
      next.version,
      JSON.stringify(next.document),
      next.enabled,
      JSON.stringify(next.tags),
      id
    ]
  );
  return row ? rowToPolicy(row) : null;
}

export async function deletePolicy(id: string, viewer: Viewer): Promise<boolean> {
  await ensureInit();
  // Visibility check first — non-owners shouldn't be able to discover IDs by
  // probing 200/404 here either.
  const existing = await getPolicy(id, viewer);
  if (!existing) return false;
  const rows = await execute(`DELETE FROM policies WHERE id = $1`, [id]);
  return rows > 0;
}

export interface PolicyEvaluation {
  id: string;
  policyId: string;
  policyName: string | null;
  decision: 'allow' | 'deny' | 'throttle' | 'require_approval';
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  reason: string | null;
  context: unknown;
  evaluatedBy: string | null;
  processingTimeMs: number;
  evaluatedAt: string;
}

interface PolicyEvaluationRow {
  id: string;
  policy_id: string;
  policy_name: string | null;
  decision: 'allow' | 'deny' | 'throttle' | 'require_approval';
  matched_rule_id: string | null;
  matched_rule_name: string | null;
  reason: string | null;
  context: unknown;
  evaluated_by: string | null;
  processing_time_ms: number;
  evaluated_at: Date;
}

function rowToEvaluation(row: PolicyEvaluationRow): PolicyEvaluation {
  return {
    id: row.id,
    policyId: row.policy_id,
    policyName: row.policy_name,
    decision: row.decision,
    matchedRuleId: row.matched_rule_id,
    matchedRuleName: row.matched_rule_name,
    reason: row.reason,
    context: row.context,
    evaluatedBy: row.evaluated_by,
    processingTimeMs: row.processing_time_ms,
    evaluatedAt: row.evaluated_at.toISOString()
  };
}

/**
 * List recent policy evaluations the viewer is allowed to see.
 *   - anonymous → []
 *   - authenticated → evaluations for policies they own
 *   - founder → all evaluations system-wide
 *
 * `policyId` filter narrows to a single policy. `limit` caps the response
 * (max 200) — UI defaults to 50.
 */
export async function listPolicyEvaluations(
  viewer: Viewer,
  opts: { policyId?: string; limit?: number } = {}
): Promise<PolicyEvaluation[]> {
  await ensureInit();
  const limit = Math.max(1, Math.min(200, opts.limit ?? 50));

  if (viewer.isFounder) {
    const rows = opts.policyId
      ? await query<PolicyEvaluationRow>(
          `SELECT e.*, p.name AS policy_name
           FROM policy_evaluations e
           LEFT JOIN policies p ON p.id = e.policy_id
           WHERE e.policy_id = $1
           ORDER BY e.evaluated_at DESC
           LIMIT $2`,
          [opts.policyId, limit]
        )
      : await query<PolicyEvaluationRow>(
          `SELECT e.*, p.name AS policy_name
           FROM policy_evaluations e
           LEFT JOIN policies p ON p.id = e.policy_id
           ORDER BY e.evaluated_at DESC
           LIMIT $1`,
          [limit]
        );
    return rows.map(rowToEvaluation);
  }
  if (!viewer.userId) return [];
  const rows = opts.policyId
    ? await query<PolicyEvaluationRow>(
        `SELECT e.*, p.name AS policy_name
         FROM policy_evaluations e
         INNER JOIN policies p ON p.id = e.policy_id
         WHERE p.owner_user_id = $1 AND e.policy_id = $2
         ORDER BY e.evaluated_at DESC
         LIMIT $3`,
        [viewer.userId, opts.policyId, limit]
      )
    : await query<PolicyEvaluationRow>(
        `SELECT e.*, p.name AS policy_name
         FROM policy_evaluations e
         INNER JOIN policies p ON p.id = e.policy_id
         WHERE p.owner_user_id = $1
         ORDER BY e.evaluated_at DESC
         LIMIT $2`,
        [viewer.userId, limit]
      );
  return rows.map(rowToEvaluation);
}
