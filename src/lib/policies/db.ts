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
