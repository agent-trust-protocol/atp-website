/**
 * Postgres-backed agent store. Replaces the previous in-memory demo store
 * (was at `src/lib/demo-agents.ts`) so created agents survive serverless
 * cold starts and are scoped to the user who created them.
 *
 * Viewer model:
 *   - anonymous → sees no agents (sign in to create/manage)
 *   - authenticated → sees agents they own
 *   - founder (FOUNDER_EMAIL via isFounderSession) → sees every row
 *
 * The table is created by `initializeAppTables()` in src/lib/db.ts.
 */

import { query, queryOne, execute, initializeAppTables } from '@/lib/db';
import type { Viewer } from '@/lib/viewer';

export type { Viewer };

export type TrustTier =
  | 'untrusted'
  | 'basic'
  | 'verified'
  | 'premium'
  | 'enterprise';

export interface DemoAgent {
  id: string;
  name: string;
  did: string;
  organization: string;
  description: string;
  trustLevel: TrustTier;
  trustScore: number; // 0..1
  status: 'active' | 'inactive' | 'suspended';
  riskFactors: string[];
  createdAt: string;
  lastSeen: string;
}

const TRUST_SCORES: Record<TrustTier, number> = {
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

interface AgentRow {
  id: string;
  owner_user_id: string | null;
  name: string;
  did: string;
  organization: string;
  description: string;
  trust_level: TrustTier;
  trust_score: number;
  status: 'active' | 'inactive' | 'suspended';
  risk_factors: string[];
  created_at: Date;
  last_seen: Date;
}

function rowToAgent(row: AgentRow): DemoAgent {
  return {
    id: row.id,
    name: row.name,
    did: row.did,
    organization: row.organization,
    description: row.description,
    trustLevel: row.trust_level,
    trustScore: Number(row.trust_score),
    status: row.status,
    riskFactors: row.risk_factors,
    createdAt: row.created_at.toISOString(),
    lastSeen: row.last_seen.toISOString()
  };
}

// CREATE TABLE IF NOT EXISTS is idempotent; one promise per process avoids
// the round-trip on every request without coordinating across instances.
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

export async function listAgents(viewer: Viewer): Promise<DemoAgent[]> {
  await ensureInit();
  if (viewer.isFounder) {
    const rows = await query<AgentRow>(
      `SELECT * FROM agents ORDER BY created_at DESC`
    );
    return rows.map(rowToAgent);
  }
  if (!viewer.userId) return [];
  const rows = await query<AgentRow>(
    `SELECT * FROM agents WHERE owner_user_id = $1 ORDER BY created_at DESC`,
    [viewer.userId]
  );
  return rows.map(rowToAgent);
}

export async function getAgent(
  id: string,
  viewer: Viewer
): Promise<DemoAgent | undefined> {
  await ensureInit();
  const row = await queryOne<AgentRow>(
    `SELECT * FROM agents WHERE id = $1`,
    [id]
  );
  if (!row) return undefined;
  // Visibility: founder sees everything; owner sees their own; nobody else.
  if (!viewer.isFounder && row.owner_user_id !== viewer.userId) return undefined;
  return rowToAgent(row);
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface CreateAgentInput {
  name: string;
  did?: string;
  organization?: string;
  description?: string;
  trustLevel?: TrustTier;
}

export async function createAgent(
  input: CreateAgentInput,
  owner: { userId: string }
): Promise<DemoAgent> {
  await ensureInit();
  const slug = slugify(input.name) || 'agent';
  const id = `${slug}-${Date.now().toString(36)}`;
  const trustLevel: TrustTier = input.trustLevel ?? 'basic';
  const did = input.did?.trim() || `did:atp:${id}`;
  const organization = input.organization?.trim() ?? '';
  const description = input.description?.trim() ?? '';
  const trustScore = TRUST_SCORES[trustLevel];
  const riskFactors = RISK_FACTORS_BY_TIER[trustLevel];

  await execute(
    `INSERT INTO agents (
      id, owner_user_id, name, did, organization, description,
      trust_level, trust_score, status, risk_factors
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)`,
    [id, owner.userId, input.name, did, organization, description, trustLevel, trustScore, riskFactors]
  );

  const row = await queryOne<AgentRow>(
    `SELECT * FROM agents WHERE id = $1`,
    [id]
  );
  if (!row) throw new Error('Agent insert succeeded but row not found');
  return rowToAgent(row);
}
