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

import { randomBytes } from 'node:crypto';
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

export interface TenantMember {
  userId: string;
  email: string | null;
  name: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

interface TenantMemberRow {
  user_id: string;
  email: string | null;
  name: string | null;
  role: 'owner' | 'admin' | 'member';
  created_at: Date;
}

/**
 * Members of a tenant, joined with the Better Auth user table for
 * display fields. Anyone who is themselves a member of the tenant
 * (or founder) can see the member list.
 */
export async function listTenantMembers(
  tenantId: string,
  viewer: Viewer
): Promise<TenantMember[] | null> {
  await ensureInit();
  // Visibility: same rule as getTenantById — must be a member or founder.
  const tenant = await getTenantById(tenantId, viewer);
  if (!tenant) return null;
  const rows = await query<TenantMemberRow>(
    `SELECT ut.user_id, ut.role, ut.created_at,
            u.email, u.name
     FROM user_tenants ut
     LEFT JOIN "user" u ON u.id = ut.user_id
     WHERE ut.tenant_id = $1
     ORDER BY
       CASE ut.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
       ut.created_at ASC`,
    [tenantId]
  );
  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    role: r.role,
    joinedAt: r.created_at.toISOString()
  }));
}

/**
 * Remove a user from a tenant. Owner-only (founder bypass). Cannot
 * remove an owner via this path — to relinquish ownership, transfer
 * the role first or delete the tenant.
 * Returns true on success, false on not-found/not-permitted/refused.
 */
export async function removeTenantMember(
  tenantId: string,
  targetUserId: string,
  actor: Viewer
): Promise<{ ok: boolean; reason?: string }> {
  await ensureInit();
  const tenant = await getTenantById(tenantId, actor);
  if (!tenant) return { ok: false, reason: 'Tenant not found' };

  // Permission check — owner or founder only.
  if (!actor.isFounder) {
    const actorMembership = await queryOne<{ role: string }>(
      `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, actor.userId]
    );
    if (!actorMembership || actorMembership.role !== 'owner') {
      return { ok: false, reason: 'Only the tenant owner can remove members' };
    }
  }

  // Find target membership + role.
  const targetMembership = await queryOne<{ role: string }>(
    `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, targetUserId]
  );
  if (!targetMembership) return { ok: false, reason: 'Member not found' };

  // Can't remove an owner via this path — guards against accidental
  // self-removal that would orphan the tenant.
  if (targetMembership.role === 'owner') {
    return { ok: false, reason: 'Cannot remove the tenant owner. Transfer ownership first or delete the tenant.' };
  }

  const rows = await execute(
    `DELETE FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, targetUserId]
  );
  return { ok: rows > 0 };
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  tenantName: string | null;
  email: string;
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitedBy: string | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

interface TenantInvitationRow {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  email: string;
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invited_by: string | null;
  expires_at: Date;
  created_at: Date;
  accepted_at: Date | null;
}

function rowToInvitation(row: TenantInvitationRow): TenantInvitation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    email: row.email,
    role: row.role,
    token: row.token,
    status: row.status,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    acceptedAt: row.accepted_at?.toISOString() ?? null
  };
}

const INVITATION_TTL_DAYS = 14;

async function canInvite(tenantId: string, actor: Viewer): Promise<boolean> {
  if (actor.isFounder) return true;
  if (!actor.userId) return false;
  const r = await queryOne<{ role: string }>(
    `SELECT role FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, actor.userId]
  );
  return r?.role === 'owner' || r?.role === 'admin';
}

/**
 * Create a pending invitation. Owner/admin (or founder) only. Returns the
 * created row including the token so the caller can build a URL + send
 * the email. Token is a URL-safe random string; matched only by exact
 * value lookup so brute-forcing it is infeasible.
 */
export async function createInvitation(
  tenantId: string,
  input: { email: string; role?: 'admin' | 'member' },
  actor: Viewer
): Promise<TenantInvitation | null> {
  await ensureInit();
  const tenant = await getTenantById(tenantId, actor);
  if (!tenant) return null;
  if (!(await canInvite(tenantId, actor))) return null;

  const email = input.email.trim().toLowerCase();
  const role = input.role ?? 'member';
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const row = await queryOne<TenantInvitationRow>(
    `INSERT INTO tenant_invitations (tenant_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *, (SELECT name FROM tenants WHERE id = $1) AS tenant_name`,
    [tenantId, email, role, token, actor.userId, expiresAt]
  );
  return row ? rowToInvitation(row) : null;
}

/** List invitations on a tenant (any status). Member or founder can read. */
export async function listInvitations(
  tenantId: string,
  viewer: Viewer
): Promise<TenantInvitation[] | null> {
  await ensureInit();
  const tenant = await getTenantById(tenantId, viewer);
  if (!tenant) return null;
  const rows = await query<TenantInvitationRow>(
    `SELECT i.*, t.name AS tenant_name
     FROM tenant_invitations i
     JOIN tenants t ON t.id = i.tenant_id
     WHERE i.tenant_id = $1
     ORDER BY i.created_at DESC`,
    [tenantId]
  );
  return rows.map(rowToInvitation);
}

/** Revoke a pending invitation. Owner/admin (or founder) only. */
export async function revokeInvitation(
  invitationId: string,
  actor: Viewer
): Promise<boolean> {
  await ensureInit();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)) {
    return false;
  }
  const inv = await queryOne<{ tenant_id: string; status: string }>(
    `SELECT tenant_id, status FROM tenant_invitations WHERE id = $1`,
    [invitationId]
  );
  if (!inv) return false;
  if (!(await canInvite(inv.tenant_id, actor))) return false;
  if (inv.status !== 'pending') return false;
  const rows = await execute(
    `UPDATE tenant_invitations SET status = 'revoked' WHERE id = $1`,
    [invitationId]
  );
  return rows > 0;
}

/**
 * Look up an invitation by its token. Public — no viewer scoping —
 * because the token itself is the secret. Auto-marks expired ones on
 * read so the UI doesn't have to.
 */
export async function getInvitationByToken(token: string): Promise<TenantInvitation | null> {
  await ensureInit();
  if (!token || token.length < 16) return null;
  const row = await queryOne<TenantInvitationRow>(
    `SELECT i.*, t.name AS tenant_name
     FROM tenant_invitations i
     JOIN tenants t ON t.id = i.tenant_id
     WHERE i.token = $1`,
    [token]
  );
  if (!row) return null;
  if (row.status === 'pending' && row.expires_at < new Date()) {
    await execute(
      `UPDATE tenant_invitations SET status = 'expired' WHERE id = $1 AND status = 'pending'`,
      [row.id]
    );
    row.status = 'expired';
  }
  return rowToInvitation(row);
}

/**
 * Accept an invitation as the signed-in user. The acceptor's email
 * must match the invitation's `email` (case-insensitive) — otherwise
 * the invite is rejected. On success: adds a user_tenants row with
 * the invited role and flips status to 'accepted'.
 */
export async function acceptInvitation(
  token: string,
  user: { id: string; email: string }
): Promise<{ ok: boolean; reason?: string; tenantId?: string }> {
  await ensureInit();
  const inv = await getInvitationByToken(token);
  if (!inv) return { ok: false, reason: 'Invitation not found' };
  if (inv.status !== 'pending') return { ok: false, reason: `Invitation ${inv.status}` };
  if (inv.email.toLowerCase() !== user.email.trim().toLowerCase()) {
    return { ok: false, reason: 'This invitation was issued to a different email address.' };
  }
  // Check whether the user is already a member (idempotent accept).
  const existing = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM user_tenants WHERE tenant_id = $1 AND user_id = $2`,
    [inv.tenantId, user.id]
  );
  await execute(`BEGIN`);
  try {
    if (!existing) {
      await execute(
        `INSERT INTO user_tenants (user_id, tenant_id, role) VALUES ($1, $2, $3)`,
        [user.id, inv.tenantId, inv.role]
      );
    }
    await execute(
      `UPDATE tenant_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [inv.id]
    );
    await execute(`COMMIT`);
    return { ok: true, tenantId: inv.tenantId };
  } catch (err) {
    await execute(`ROLLBACK`).catch(() => undefined);
    return { ok: false, reason: err instanceof Error ? err.message : 'Accept failed' };
  }
}
