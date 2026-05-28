/**
 * Fire-and-forget audit event recorder.
 *
 * Writes to the existing `audit_logs` table (read by src/lib/activity.ts),
 * so a successful call here automatically shows up in the unified
 * activity timeline — no extra UI wiring needed.
 *
 * Contract:
 *   - never throws (a failed audit insert must not break the user mutation
 *     that triggered it; we log and move on)
 *   - never blocks for long; callers await it because pg is fast and
 *     because dropping the await opens up a serverless cold-shutdown
 *     race where the insert never runs
 *   - safe to call with anonymous viewer (writes user_id NULL); useful
 *     for invitation accept-by-token before we have a session
 */

import { randomUUID } from 'node:crypto';
import { execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type AuditEntityType =
  | 'agent'
  | 'workflow'
  | 'policy'
  | 'tenant'
  | 'tenant_invitation'
  | 'tenant_member';

export interface AuditEventInput {
  entityType: AuditEntityType;
  entityId: string;
  /** Verb-object slug, e.g. 'create', 'update', 'delete', 'accept', 'revoke'. */
  action: string;
  /** Diff or before/after snapshot. Stored as jsonb. */
  changes?: Record<string, unknown> | null;
  /** Free-form context (e.g. rename payload, role change details). */
  metadata?: Record<string, unknown> | null;
  /** Pass the request to capture ip + user-agent — omitted = NULL. */
  request?: { headers: Headers };
}

function clientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? null;
}

export async function recordAuditEvent(viewer: Viewer, input: AuditEventInput): Promise<void> {
  try {
    const ip = input.request ? clientIp(input.request.headers) : null;
    const ua = input.request ? input.request.headers.get('user-agent') : null;

    await execute(
      `INSERT INTO audit_logs
         (id, entity_type, entity_id, action, user_id, user_name, changes, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
      [
        randomUUID(),
        input.entityType,
        input.entityId,
        input.action,
        viewer.userId,
        null,
        input.changes ? JSON.stringify(input.changes) : null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        ip,
        ua
      ]
    );
  } catch (err) {
    console.error('[audit] failed to record event', {
      entityType: input.entityType,
      action: input.action,
      err: err instanceof Error ? err.message : String(err)
    });
  }
}
