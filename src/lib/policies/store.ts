/**
 * Policy persistence — viewer-scoped CRUD over the `policies` table.
 *
 * The visual policy editor speaks a Permission-Service-flavored wire
 * shape: a "document" wrapping nodes/edges/tags/category, plus
 * top-level name/description/createdBy. We accept that shape here and
 * unflatten it into columns so existing UI code keeps working without
 * an external service running.
 */

import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export interface PolicyRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  tags: string[];
  category: string;
  nodes: unknown[];
  edges: unknown[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export class NotAuthorized extends Error {
  constructor(message = 'Authentication required') { super(message); this.name = 'NotAuthorized'; }
}
export class NotFound extends Error {
  constructor(message = 'Policy not found') { super(message); this.name = 'NotFound'; }
}

export async function listPolicies(viewer: Viewer): Promise<PolicyRow[]> {
  if (!viewer.userId && !viewer.isFounder) return [];
  if (viewer.isFounder) {
    return query<PolicyRow>(`SELECT * FROM policies ORDER BY updated_at DESC`);
  }
  return query<PolicyRow>(
    `SELECT * FROM policies WHERE user_id = $1 ORDER BY updated_at DESC`,
    [viewer.userId]
  );
}

export async function getPolicy(viewer: Viewer, id: string): Promise<PolicyRow | null> {
  if (!viewer.userId && !viewer.isFounder) return null;
  const row = await queryOne<PolicyRow>(`SELECT * FROM policies WHERE id = $1`, [id]);
  if (!row) return null;
  if (!viewer.isFounder && row.user_id !== viewer.userId) return null;
  return row;
}

/** Wire-shape payload from the visual editor. */
export interface PolicyWirePayload {
  document?: {
    id?: string;
    name?: string;
    description?: string;
    nodes?: unknown[];
    edges?: unknown[];
    tags?: string[];
    category?: string;
  };
  name?: string;
  description?: string;
  createdBy?: string;
  enabled?: boolean;
  version?: string;
}

interface NormalizedPolicy {
  id?: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  tags: string[];
  category: string;
  nodes: unknown[];
  edges: unknown[];
  createdBy: string | null;
}

function normalize(payload: PolicyWirePayload): NormalizedPolicy {
  const doc = payload.document ?? {};
  return {
    id: doc.id,
    name: (payload.name ?? doc.name ?? '').trim(),
    description: payload.description ?? doc.description ?? '',
    version: payload.version ?? '1.0.0',
    enabled: payload.enabled ?? false,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    category: doc.category ?? 'operational',
    nodes: Array.isArray(doc.nodes) ? doc.nodes : [],
    edges: Array.isArray(doc.edges) ? doc.edges : [],
    createdBy: payload.createdBy ?? null
  };
}

export async function createPolicy(viewer: Viewer, payload: PolicyWirePayload): Promise<PolicyRow> {
  if (!viewer.userId) throw new NotAuthorized();
  const p = normalize(payload);
  if (!p.name) throw new Error('Policy name is required');

  const id = p.id ?? `pol_${randomUUID()}`;
  const row = await queryOne<PolicyRow>(
    `INSERT INTO policies
       (id, user_id, name, description, version, enabled, tags, category, nodes, edges, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
     RETURNING *`,
    [
      id,
      viewer.userId,
      p.name,
      p.description,
      p.version,
      p.enabled,
      p.tags,
      p.category,
      JSON.stringify(p.nodes),
      JSON.stringify(p.edges),
      p.createdBy
    ]
  );
  return row!;
}

/** Upsert by id so the editor's "PUT then POST-on-404" flow folds into a single write. */
export async function upsertPolicy(viewer: Viewer, id: string, payload: PolicyWirePayload): Promise<PolicyRow> {
  if (!viewer.userId) throw new NotAuthorized();
  const existing = await queryOne<PolicyRow>(`SELECT * FROM policies WHERE id = $1`, [id]);
  if (existing && !viewer.isFounder && existing.user_id !== viewer.userId) {
    throw new NotFound();
  }

  const p = normalize(payload);
  if (!p.name) throw new Error('Policy name is required');

  if (existing) {
    const row = await queryOne<PolicyRow>(
      `UPDATE policies SET
         name = $2,
         description = $3,
         version = $4,
         enabled = $5,
         tags = $6,
         category = $7,
         nodes = $8::jsonb,
         edges = $9::jsonb,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, p.name, p.description, p.version, p.enabled, p.tags, p.category, JSON.stringify(p.nodes), JSON.stringify(p.edges)]
    );
    return row!;
  }

  return createPolicy(viewer, { ...payload, document: { ...(payload.document ?? {}), id } });
}

export async function deletePolicy(viewer: Viewer, id: string): Promise<boolean> {
  const existing = await getPolicy(viewer, id);
  if (!existing) return false;
  const n = await execute(`DELETE FROM policies WHERE id = $1`, [id]);
  return n > 0;
}

/** Wire shape returned to the editor. */
export function toApiShape(row: PolicyRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    enabled: row.enabled,
    tags: row.tags,
    category: row.category,
    nodes: row.nodes,
    edges: row.edges,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
