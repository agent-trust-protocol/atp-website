/**
 * Agent persistence — viewer-scoped CRUD over the `agents` table.
 *
 * Scoping follows the same pattern as workflows: member sees own rows,
 * founder sees all, anonymous gets [].
 *
 * The public marketing dashboard renders demo data for anonymous viewers
 * (see SEED_AGENTS in demo-agents.ts) — that fallback lives in the route
 * layer, not here. This module only deals with persisted, user-owned agents.
 */

import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type TrustTier = 'untrusted' | 'basic' | 'verified' | 'premium' | 'enterprise';

export const TRUST_SCORES: Record<TrustTier, number> = {
  untrusted: 0.1,
  basic: 0.35,
  verified: 0.65,
  premium: 0.85,
  enterprise: 0.95
};

const RISK_FACTORS_BY_TIER: Record<TrustTier, string[]> = {
  untrusted: ['No verified credentials', 'No interaction history', 'Unrecognized organization'],
  basic: ['Limited interaction history', 'No third-party attestations'],
  verified: ['Independent attestation pending refresh'],
  premium: [],
  enterprise: []
};

const VALID_TIERS: TrustTier[] = ['untrusted', 'basic', 'verified', 'premium', 'enterprise'];
export function isTrustTier(value: unknown): value is TrustTier {
  return typeof value === 'string' && (VALID_TIERS as string[]).includes(value);
}

export interface AgentRow {
  id: string;
  user_id: string;
  name: string;
  did: string;
  organization: string;
  description: string;
  trust_level: TrustTier;
  trust_score: number;
  status: 'active' | 'inactive' | 'suspended';
  risk_factors: string[];
  created_at: string;
  last_seen: string;
}

export class NotAuthorized extends Error {
  constructor(message = 'Authentication required') { super(message); this.name = 'NotAuthorized'; }
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listAgents(viewer: Viewer): Promise<AgentRow[]> {
  if (!viewer.userId && !viewer.isFounder) return [];

  if (viewer.isFounder) {
    return query<AgentRow>(`SELECT * FROM agents ORDER BY created_at DESC`);
  }
  return query<AgentRow>(
    `SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC`,
    [viewer.userId]
  );
}

export async function getAgent(viewer: Viewer, id: string): Promise<AgentRow | null> {
  if (!viewer.userId && !viewer.isFounder) return null;
  const row = await queryOne<AgentRow>(`SELECT * FROM agents WHERE id = $1`, [id]);
  if (!row) return null;
  if (!viewer.isFounder && row.user_id !== viewer.userId) return null;
  return row;
}

export interface CreateAgentInput {
  name: string;
  did?: string;
  organization?: string;
  description?: string;
  trustLevel?: TrustTier;
}

export async function createAgent(viewer: Viewer, input: CreateAgentInput): Promise<AgentRow> {
  if (!viewer.userId) throw new NotAuthorized();
  if (!input.name?.trim()) throw new Error('Agent name is required');

  const slug = slugify(input.name) || 'agent';
  const id = `${slug}-${randomUUID().slice(0, 8)}`;
  const trustLevel: TrustTier = input.trustLevel ?? 'basic';
  const did = input.did?.trim() || `did:atp:${id}`;

  const row = await queryOne<AgentRow>(
    `INSERT INTO agents (id, user_id, name, did, organization, description, trust_level, trust_score, status, risk_factors)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
     RETURNING *`,
    [
      id,
      viewer.userId,
      input.name.trim(),
      did,
      input.organization?.trim() ?? '',
      input.description?.trim() ?? '',
      trustLevel,
      TRUST_SCORES[trustLevel],
      RISK_FACTORS_BY_TIER[trustLevel]
    ]
  );
  return row!;
}

export async function deleteAgent(viewer: Viewer, id: string): Promise<boolean> {
  const existing = await getAgent(viewer, id);
  if (!existing) return false;
  const n = await execute(`DELETE FROM agents WHERE id = $1`, [id]);
  return n > 0;
}

/** Map a DB row to the API shape the dashboard already consumes. */
export function toApiShape(row: AgentRow) {
  return {
    id: row.id,
    name: row.name,
    did: row.did,
    organization: row.organization,
    description: row.description,
    trustLevel: row.trust_level,
    trustScore: row.trust_score,
    status: row.status,
    riskFactors: row.risk_factors,
    createdAt: row.created_at,
    lastSeen: row.last_seen
  };
}
