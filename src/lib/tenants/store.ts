/**
 * Tenant persistence — viewer-scoped CRUD over the `tenants` table.
 *
 * Same scoping rules as agents/workflows: member sees their own
 * tenants, founder sees all, anonymous gets [].
 *
 * Tenants here represent ATP Cloud workspaces owned by a signed-in
 * user, not Better Auth's `user` rows themselves. A user can own many
 * tenants (one per environment / customer org they manage).
 */

import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type TenantStatus = 'active' | 'suspended' | 'pending';
export type TenantPlan = 'Basic' | 'Professional' | 'Enterprise';
export type TenantTrustLevel = 'Basic' | 'Verified' | 'Premium' | 'Enterprise';

const VALID_STATUS: TenantStatus[] = ['active', 'suspended', 'pending'];
const VALID_PLAN: TenantPlan[] = ['Basic', 'Professional', 'Enterprise'];
const VALID_TRUST: TenantTrustLevel[] = ['Basic', 'Verified', 'Premium', 'Enterprise'];

export function isTenantStatus(v: unknown): v is TenantStatus {
  return typeof v === 'string' && (VALID_STATUS as string[]).includes(v);
}
export function isTenantPlan(v: unknown): v is TenantPlan {
  return typeof v === 'string' && (VALID_PLAN as string[]).includes(v);
}
export function isTenantTrustLevel(v: unknown): v is TenantTrustLevel {
  return typeof v === 'string' && (VALID_TRUST as string[]).includes(v);
}

export interface TenantRow {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  plan: TenantPlan;
  trust_level: TenantTrustLevel;
  user_count: number;
  created_at: string;
  last_active: string;
}

export class NotAuthorized extends Error {
  constructor(message = 'Authentication required') { super(message); this.name = 'NotAuthorized'; }
}
export class NotFound extends Error {
  constructor(message = 'Tenant not found') { super(message); this.name = 'NotFound'; }
}
export class DomainTaken extends Error {
  constructor(message = 'Domain is already in use') { super(message); this.name = 'DomainTaken'; }
}

function slugifyDomain(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tenant';
}

export async function listTenants(viewer: Viewer): Promise<TenantRow[]> {
  if (!viewer.userId && !viewer.isFounder) return [];
  if (viewer.isFounder) {
    return query<TenantRow>(`SELECT * FROM tenants ORDER BY created_at DESC`);
  }
  return query<TenantRow>(
    `SELECT * FROM tenants WHERE user_id = $1 ORDER BY created_at DESC`,
    [viewer.userId]
  );
}

export async function getTenant(viewer: Viewer, id: string): Promise<TenantRow | null> {
  if (!viewer.userId && !viewer.isFounder) return null;
  const row = await queryOne<TenantRow>(`SELECT * FROM tenants WHERE id = $1`, [id]);
  if (!row) return null;
  if (!viewer.isFounder && row.user_id !== viewer.userId) return null;
  return row;
}

export interface CreateTenantInput {
  name: string;
  domain?: string;
  plan?: TenantPlan;
  trustLevel?: TenantTrustLevel;
}

export async function createTenant(viewer: Viewer, input: CreateTenantInput): Promise<TenantRow> {
  if (!viewer.userId) throw new NotAuthorized();
  const name = input.name?.trim();
  if (!name) throw new Error('Tenant name is required');

  const slug = input.domain?.trim() || slugifyDomain(name);
  const domain = slug.endsWith('.atp.cloud') ? slug : `${slug}.atp.cloud`;

  const existing = await queryOne<{ id: string }>(`SELECT id FROM tenants WHERE domain = $1`, [domain]);
  if (existing) throw new DomainTaken();

  const id = `tnt_${randomUUID()}`;
  const row = await queryOne<TenantRow>(
    `INSERT INTO tenants (id, user_id, name, domain, status, plan, trust_level)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6)
     RETURNING *`,
    [id, viewer.userId, name, domain, input.plan ?? 'Basic', input.trustLevel ?? 'Basic']
  );
  return row!;
}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  trustLevel?: TenantTrustLevel;
}

export async function updateTenant(viewer: Viewer, id: string, patch: UpdateTenantInput): Promise<TenantRow> {
  const existing = await getTenant(viewer, id);
  if (!existing) throw new NotFound();

  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, value: unknown) => {
    params.push(value);
    sets.push(`${col} = $${params.length}`);
  };
  if (patch.name !== undefined) push('name', patch.name.trim());
  if (patch.status !== undefined) push('status', patch.status);
  if (patch.plan !== undefined) push('plan', patch.plan);
  if (patch.trustLevel !== undefined) push('trust_level', patch.trustLevel);
  if (sets.length === 0) return existing;

  params.push(id);
  const row = await queryOne<TenantRow>(
    `UPDATE tenants SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return row!;
}

export async function deleteTenant(viewer: Viewer, id: string): Promise<boolean> {
  const existing = await getTenant(viewer, id);
  if (!existing) return false;
  const n = await execute(`DELETE FROM tenants WHERE id = $1`, [id]);
  return n > 0;
}

export function toApiShape(row: TenantRow) {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    status: row.status,
    plan: row.plan,
    trustLevel: row.trust_level,
    users: row.user_count,
    createdAt: row.created_at,
    lastActive: row.last_active
  };
}
