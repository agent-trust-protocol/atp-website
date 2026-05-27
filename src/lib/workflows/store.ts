/**
 * Workflow persistence — viewer-scoped CRUD over the `workflows` table.
 *
 * Scoping rules (enforced here, not at the route layer):
 *   - anonymous viewer → list returns []; mutating ops throw NotAuthorized
 *   - member viewer    → list/get/update/delete only rows WHERE user_id = viewer.userId
 *   - founder viewer   → list returns all rows; get/update/delete work on any row
 *
 * Routes call these helpers with a Viewer from `getViewer(headers)` so the
 * scoping logic lives in one place and can't be skipped by a caller that
 * forgets to add `WHERE user_id = $1`.
 */

import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export interface WorkflowRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: unknown[];
  edges: unknown[];
  variables: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class NotAuthorized extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'NotAuthorized';
  }
}

export class NotFound extends Error {
  constructor(message = 'Workflow not found') {
    super(message);
    this.name = 'NotFound';
  }
}

interface ListOptions {
  status?: string;
  limit?: number;
}

export async function listWorkflows(viewer: Viewer, opts: ListOptions = {}): Promise<WorkflowRow[]> {
  if (!viewer.userId && !viewer.isFounder) return [];

  const clauses: string[] = [];
  const params: unknown[] = [];

  if (!viewer.isFounder) {
    params.push(viewer.userId);
    clauses.push(`user_id = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    clauses.push(`status = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = opts.limit && opts.limit > 0 ? ` LIMIT ${Math.min(opts.limit, 500)}` : '';

  return query<WorkflowRow>(
    `SELECT * FROM workflows ${where} ORDER BY updated_at DESC${limit}`,
    params
  );
}

export async function getWorkflow(viewer: Viewer, id: string): Promise<WorkflowRow | null> {
  if (!viewer.userId && !viewer.isFounder) return null;

  const row = await queryOne<WorkflowRow>(`SELECT * FROM workflows WHERE id = $1`, [id]);
  if (!row) return null;
  if (!viewer.isFounder && row.user_id !== viewer.userId) return null;
  return row;
}

export interface WorkflowInput {
  name: string;
  description?: string;
  status?: WorkflowRow['status'];
  nodes?: unknown[];
  edges?: unknown[];
  variables?: Record<string, unknown>;
}

export async function createWorkflow(viewer: Viewer, input: WorkflowInput): Promise<WorkflowRow> {
  if (!viewer.userId) throw new NotAuthorized();
  if (!input.name?.trim()) throw new Error('Workflow name is required');

  const id = `wf_${randomUUID()}`;
  const row = await queryOne<WorkflowRow>(
    `INSERT INTO workflows (id, user_id, name, description, status, nodes, edges, variables)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
     RETURNING *`,
    [
      id,
      viewer.userId,
      input.name.trim(),
      input.description ?? '',
      input.status ?? 'draft',
      JSON.stringify(input.nodes ?? []),
      JSON.stringify(input.edges ?? []),
      JSON.stringify(input.variables ?? {})
    ]
  );
  return row!;
}

export async function updateWorkflow(
  viewer: Viewer,
  id: string,
  patch: Partial<WorkflowInput>
): Promise<WorkflowRow> {
  const existing = await getWorkflow(viewer, id);
  if (!existing) throw new NotFound();

  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, value: unknown, cast = '') => {
    params.push(value);
    sets.push(`${col} = $${params.length}${cast}`);
  };

  if (patch.name !== undefined) push('name', patch.name.trim());
  if (patch.description !== undefined) push('description', patch.description);
  if (patch.status !== undefined) push('status', patch.status);
  if (patch.nodes !== undefined) push('nodes', JSON.stringify(patch.nodes), '::jsonb');
  if (patch.edges !== undefined) push('edges', JSON.stringify(patch.edges), '::jsonb');
  if (patch.variables !== undefined) push('variables', JSON.stringify(patch.variables), '::jsonb');

  if (sets.length === 0) return existing;

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const row = await queryOne<WorkflowRow>(
    `UPDATE workflows SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return row!;
}

export async function deleteWorkflow(viewer: Viewer, id: string): Promise<boolean> {
  const existing = await getWorkflow(viewer, id);
  if (!existing) return false;
  const n = await execute(`DELETE FROM workflows WHERE id = $1`, [id]);
  return n > 0;
}

export function toApiShape(row: WorkflowRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    nodes: row.nodes,
    edges: row.edges,
    variables: row.variables,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
