/**
 * Unified activity timeline. Pulls events from four sources and merges
 * them client-side into a single chronological feed:
 *
 *   - policy_evaluations    (engine decisions)
 *   - workflow_executions   (workflow runs)
 *   - audit_logs            (workflow report rows + future audits)
 *   - tenant_invitations    (issued / accepted / revoked)
 *
 * UNION in code rather than SQL because each source has a different
 * row shape — clearer than SELECT-with-CASE acrobatics, and the
 * per-source limit (LIMIT_PER_SOURCE) keeps the total query work
 * bounded regardless of how many sources we add later.
 */

import { query } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type ActivitySource =
  | 'policy_evaluation'
  | 'workflow_execution'
  | 'audit_log'
  | 'tenant_invitation';

export interface ActivityEvent {
  id: string;
  source: ActivitySource;
  /** ISO-8601. */
  timestamp: string;
  title: string;
  detail: string | null;
  /** Optional status badge string (e.g. 'success', 'failed', 'allow', 'deny'). */
  status: string | null;
  /** Optional link to a detail page. */
  href: string | null;
}

const LIMIT_PER_SOURCE = 25;

async function loadPolicyEvaluations(viewer: Viewer): Promise<ActivityEvent[]> {
  const sql = viewer.isFounder
    ? `SELECT e.id, e.decision, e.matched_rule_name, e.evaluated_at, e.policy_id, p.name AS policy_name
       FROM policy_evaluations e LEFT JOIN policies p ON p.id = e.policy_id
       ORDER BY e.evaluated_at DESC LIMIT $1`
    : `SELECT e.id, e.decision, e.matched_rule_name, e.evaluated_at, e.policy_id, p.name AS policy_name
       FROM policy_evaluations e INNER JOIN policies p ON p.id = e.policy_id
       WHERE p.owner_user_id = $2
       ORDER BY e.evaluated_at DESC LIMIT $1`;
  const params = viewer.isFounder ? [LIMIT_PER_SOURCE] : [LIMIT_PER_SOURCE, viewer.userId];
  if (!viewer.isFounder && !viewer.userId) return [];
  const rows = await query<{
    id: string;
    decision: string;
    matched_rule_name: string | null;
    evaluated_at: Date;
    policy_id: string;
    policy_name: string | null;
  }>(sql, params);
  return rows.map((r) => ({
    id: `pe:${r.id}`,
    source: 'policy_evaluation',
    timestamp: r.evaluated_at.toISOString(),
    title: `Policy ${r.decision}: ${r.policy_name ?? '(deleted)'}`,
    detail: r.matched_rule_name ? `Matched rule: ${r.matched_rule_name}` : 'No rule matched (default decision)',
    status: r.decision,
    href: '/dashboard/policy-evaluations'
  }));
}

async function loadWorkflowExecutions(viewer: Viewer): Promise<ActivityEvent[]> {
  const sql = viewer.isFounder
    ? `SELECT e.id, e.status, e.duration, e.start_time, e.trigger_type, e.workflow_id, w.name AS workflow_name, e.error_message
       FROM workflow_executions e LEFT JOIN workflows w ON w.id = e.workflow_id
       ORDER BY e.start_time DESC LIMIT $1`
    : `SELECT e.id, e.status, e.duration, e.start_time, e.trigger_type, e.workflow_id, w.name AS workflow_name, e.error_message
       FROM workflow_executions e INNER JOIN workflows w ON w.id = e.workflow_id
       WHERE w.created_by = $2
       ORDER BY e.start_time DESC LIMIT $1`;
  const params = viewer.isFounder ? [LIMIT_PER_SOURCE] : [LIMIT_PER_SOURCE, viewer.userId];
  if (!viewer.isFounder && !viewer.userId) return [];
  const rows = await query<{
    id: string;
    status: string;
    duration: number | null;
    start_time: Date;
    trigger_type: string | null;
    workflow_id: string;
    workflow_name: string | null;
    error_message: string | null;
  }>(sql, params);
  return rows.map((r) => ({
    id: `we:${r.id}`,
    source: 'workflow_execution',
    timestamp: r.start_time.toISOString(),
    title: `Workflow ${r.status}: ${r.workflow_name ?? '(deleted)'}`,
    detail: r.error_message
      ? r.error_message
      : `${r.trigger_type ?? 'manual'}${r.duration != null ? ` · ${r.duration} ms` : ''}`,
    status: r.status,
    href: `/dashboard/workflows/executions/${r.id}`
  }));
}

async function loadAuditLogs(viewer: Viewer): Promise<ActivityEvent[]> {
  const sql = viewer.isFounder
    ? `SELECT id, entity_type, entity_id, action, user_id, changes, timestamp
       FROM audit_logs ORDER BY timestamp DESC LIMIT $1`
    : `SELECT id, entity_type, entity_id, action, user_id, changes, timestamp
       FROM audit_logs WHERE user_id = $2 ORDER BY timestamp DESC LIMIT $1`;
  const params = viewer.isFounder ? [LIMIT_PER_SOURCE] : [LIMIT_PER_SOURCE, viewer.userId];
  if (!viewer.isFounder && !viewer.userId) return [];
  const rows = await query<{
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    user_id: string | null;
    changes: { reportType?: string } | null;
    timestamp: Date;
  }>(sql, params);
  return rows.map((r) => ({
    id: `al:${r.id}`,
    source: 'audit_log',
    timestamp: r.timestamp.toISOString(),
    title: `${r.action}: ${r.entity_type}`,
    detail: r.changes?.reportType
      ? `Report type: ${r.changes.reportType}`
      : `Entity ${r.entity_id.slice(0, 8)}…`,
    status: r.action,
    href: null
  }));
}

async function loadTenantInvitations(viewer: Viewer): Promise<ActivityEvent[]> {
  // Show invitations for tenants the viewer can see. Founder = all.
  // Non-founder = tenants they're a member of (any role).
  const sql = viewer.isFounder
    ? `SELECT i.id, i.email, i.role, i.status, i.created_at, i.accepted_at, i.tenant_id, t.name AS tenant_name
       FROM tenant_invitations i LEFT JOIN tenants t ON t.id = i.tenant_id
       ORDER BY COALESCE(i.accepted_at, i.created_at) DESC LIMIT $1`
    : `SELECT i.id, i.email, i.role, i.status, i.created_at, i.accepted_at, i.tenant_id, t.name AS tenant_name
       FROM tenant_invitations i
       INNER JOIN tenants t ON t.id = i.tenant_id
       INNER JOIN user_tenants ut ON ut.tenant_id = i.tenant_id
       WHERE ut.user_id = $2
       ORDER BY COALESCE(i.accepted_at, i.created_at) DESC LIMIT $1`;
  const params = viewer.isFounder ? [LIMIT_PER_SOURCE] : [LIMIT_PER_SOURCE, viewer.userId];
  if (!viewer.isFounder && !viewer.userId) return [];
  const rows = await query<{
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: Date;
    accepted_at: Date | null;
    tenant_id: string;
    tenant_name: string | null;
  }>(sql, params);
  return rows.map((r) => {
    const isAccepted = r.status === 'accepted' && r.accepted_at;
    return {
      id: `ti:${r.id}`,
      source: 'tenant_invitation',
      timestamp: (isAccepted ? r.accepted_at! : r.created_at).toISOString(),
      title: isAccepted
        ? `${r.email} joined ${r.tenant_name ?? '(unnamed)'}`
        : `Invited ${r.email} to ${r.tenant_name ?? '(unnamed)'}`,
      detail: `Role: ${r.role} · status: ${r.status}`,
      status: r.status,
      href: `/cloud/tenants/${r.tenant_id}`
    };
  });
}

/**
 * Merged, viewer-scoped activity feed. Returns at most
 * 4 × LIMIT_PER_SOURCE rows, trimmed by the caller's `limit`.
 *
 * Anonymous viewers get `[]` — every loader bails when userId is null
 * unless the viewer is founder.
 */
export async function listActivity(
  viewer: Viewer,
  opts: { limit?: number; source?: ActivitySource } = {}
): Promise<ActivityEvent[]> {
  const limit = Math.max(1, Math.min(200, opts.limit ?? 100));

  if (!viewer.isFounder && !viewer.userId) return [];

  // Run loaders in parallel — each is its own indexed SELECT so the
  // total wallclock is roughly max(single-source latency).
  const loaders: Array<Promise<ActivityEvent[]>> = [];
  if (!opts.source || opts.source === 'policy_evaluation') loaders.push(loadPolicyEvaluations(viewer));
  if (!opts.source || opts.source === 'workflow_execution') loaders.push(loadWorkflowExecutions(viewer));
  if (!opts.source || opts.source === 'audit_log') loaders.push(loadAuditLogs(viewer));
  if (!opts.source || opts.source === 'tenant_invitation') loaders.push(loadTenantInvitations(viewer));

  const groups = await Promise.all(loaders.map((p) => p.catch((err) => {
    // One failing source shouldn't kill the whole feed — log + return empty.
    console.error('[listActivity] source loader failed:', err);
    return [] as ActivityEvent[];
  })));
  const merged = groups.flat();
  merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return merged.slice(0, limit);
}
