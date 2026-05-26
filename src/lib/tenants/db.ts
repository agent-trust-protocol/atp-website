/**
 * Postgres-backed tenant store. The product positioning is enterprise SaaS,
 * so each user starts with their own tenant (auto-provisioned on first
 * access) and the `user_tenants` join exists from day one so we can extend
 * to multi-user tenants without a schema rewrite.
 *
 * Viewer model (matches agents/workflows):
 *   - anonymous → no tenants
 *   - authenticated → the tenants they're a member of (1 today)
 *   - founder → every tenant in the system
 */

import { query, queryOne, execute, initializeAppTables } from '@/lib/db';
import type { Viewer } from '@/lib/agents/store';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TenantWithMembership extends Tenant {
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended' | 'archived';
  created_at: Date;
  updated_at: Date;
}

function rowToTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

let initPromise: Promise<void> | null = null;
function ensureInit() {
  if (!initPromise) {
    initPromise = initializeAppTables().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tenant';
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  // Bounded — collisions are extremely rare with name-based slugs.
  while (await queryOne<{ id: string }>(`SELECT id FROM tenants WHERE slug = $1`, [candidate])) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

interface TenantMembershipRow extends TenantRow {
  role: 'owner' | 'admin' | 'member';
  member_count: string; // pg returns COUNT as string
}

export async function listTenantsForViewer(viewer: Viewer): Promise<TenantWithMembership[]> {
  await ensureInit();
  if (viewer.isFounder) {
    const rows = await query<TenantMembershipRow>(`
      SELECT t.*,
        'owner'::text AS role,
        (SELECT COUNT(*) FROM user_tenants ut WHERE ut.tenant_id = t.id) AS member_count
      FROM tenants t
      ORDER BY t.created_at DESC
    `);
    return rows.map((r) => ({ ...rowToTenant(r), role: r.role, memberCount: Number(r.member_count) }));
  }
  if (!viewer.userId) return [];
  const rows = await query<TenantMembershipRow>(`
    SELECT t.*,
      ut.role,
      (SELECT COUNT(*) FROM user_tenants ut2 WHERE ut2.tenant_id = t.id) AS member_count
    FROM tenants t
    JOIN user_tenants ut ON ut.tenant_id = t.id
    WHERE ut.user_id = $1
    ORDER BY t.created_at DESC
  `, [viewer.userId]);
  return rows.map((r) => ({ ...rowToTenant(r), role: r.role, memberCount: Number(r.member_count) }));
}

export async function getTenantById(id: string, viewer: Viewer): Promise<Tenant | null> {
  await ensureInit();
  // UUID validation — Postgres will throw "invalid input syntax for type uuid"
  // on a malformed id, which would surface as a 500. Treat it as not-found.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  const row = await queryOne<TenantRow>(`SELECT * FROM tenants WHERE id = $1`, [id]);
  if (!row) return null;
  if (viewer.isFounder) return rowToTenant(row);
  if (!viewer.userId) return null;
  const membership = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [id, viewer.userId]
  );
  if (!membership) return null;
  return rowToTenant(row);
}

/**
 * Lazy-create a tenant for the user on first access. Idempotent — if the
 * user already owns a tenant, returns it. Used both by `GET /api/cloud/tenants`
 * (auto-provision on first read) and by an explicit `POST` (rename).
 */
export async function getOrCreateTenantForUser(
  user: { id: string; email?: string | null; name?: string | null }
): Promise<TenantWithMembership> {
  await ensureInit();
  const existing = await queryOne<TenantMembershipRow>(`
    SELECT t.*,
      ut.role,
      (SELECT COUNT(*) FROM user_tenants ut2 WHERE ut2.tenant_id = t.id) AS member_count
    FROM tenants t
    JOIN user_tenants ut ON ut.tenant_id = t.id
    WHERE ut.user_id = $1
    ORDER BY t.created_at ASC
    LIMIT 1
  `, [user.id]);
  if (existing) {
    return { ...rowToTenant(existing), role: existing.role, memberCount: Number(existing.member_count) };
  }
  const baseName =
    (user.name && user.name.trim()) ||
    (user.email ? user.email.split('@')[0] : '') ||
    'My Tenant';
  const slug = await ensureUniqueSlug(slugify(baseName));

  await execute(`BEGIN`);
  try {
    const row = await queryOne<TenantRow>(
      `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING *`,
      [baseName, slug]
    );
    if (!row) throw new Error('Tenant insert returned no row');
    await execute(
      `INSERT INTO user_tenants (user_id, tenant_id, role) VALUES ($1, $2, 'owner')`,
      [user.id, row.id]
    );
    await execute(`COMMIT`);
    return { ...rowToTenant(row), role: 'owner', memberCount: 1 };
  } catch (err) {
    await execute(`ROLLBACK`).catch(() => undefined);
    throw err;
  }
}

/**
 * Returns the viewer's role on a specific tenant, or null if they aren't a
 * member. Used by detail pages to decide whether to allow edit actions.
 * Founder is treated as `owner` to keep the bypass consistent.
 */
export async function getViewerRoleOnTenant(
  tenantId: string,
  viewer: Viewer
): Promise<'owner' | 'admin' | 'member' | null> {
  await ensureInit();
  if (viewer.isFounder) return 'owner';
  if (!viewer.userId) return null;
  const row = await queryOne<{ role: 'owner' | 'admin' | 'member' }>(
    `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, viewer.userId]
  );
  return row?.role ?? null;
}

export async function renameTenant(
  id: string,
  name: string,
  viewer: Viewer
): Promise<Tenant | null> {
  await ensureInit();
  const tenant = await getTenantById(id, viewer);
  if (!tenant) return null;
  // Only owner/admin (or founder) can rename.
  if (!viewer.isFounder) {
    const membership = await queryOne<{ role: string }>(
      `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
      [id, viewer.userId]
    );
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return null;
    }
  }
  const row = await queryOne<TenantRow>(
    `UPDATE tenants SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [name, id]
  );
  return row ? rowToTenant(row) : null;
}

/**
 * Delete a tenant. Owner-only (founder bypass). Returns true on success,
 * false on not-found / not-permitted (same response shape so callers
 * can't enumerate tenants they don't own via 404 vs 403).
 *
 * `user_tenants` cascades on delete (Phase 3 schema). Agents/workflows/
 * policies aren't tenant-scoped today (they live by `owner_user_id`) so
 * they're unaffected — matches the 1:1 model. When multi-org lands,
 * this is where the "block delete while resources exist" check goes.
 */
export async function deleteTenant(id: string, viewer: Viewer): Promise<boolean> {
  await ensureInit();
  const tenant = await getTenantById(id, viewer);
  if (!tenant) return false;
  if (!viewer.isFounder) {
    const membership = await queryOne<{ role: string }>(
      `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
      [id, viewer.userId]
    );
    if (!membership || membership.role !== 'owner') return false;
  }
  const rows = await execute(`DELETE FROM tenants WHERE id = $1`, [id]);
  return rows > 0;
}
