/**
 * In-memory agent store for the demo dashboard.
 *
 * The dashboard is documented as "synthetic data only" (see middleware
 * publicRoutes comment), so we keep created agents in module scope rather
 * than persist them. Survives across requests in a single Node process;
 * resets on cold start in serverless environments. That tradeoff is
 * intentional — wiring this to a real DB is out of scope for the audit
 * fix and would create a much larger blast radius.
 */

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

const SEED_AGENTS: DemoAgent[] = [
  {
    id: 'seed-enterprise-alpha',
    name: 'Enterprise Bot Alpha',
    did: 'did:atp:enterprise:abc123',
    organization: 'Acme Corp',
    description: 'Production enterprise automation agent.',
    trustLevel: 'enterprise',
    trustScore: TRUST_SCORES.enterprise,
    status: 'active',
    riskFactors: RISK_FACTORS_BY_TIER.enterprise,
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    lastSeen: new Date(Date.now() - 2 * 60_000).toISOString()
  },
  {
    id: 'seed-analytics',
    name: 'Analytics Agent',
    did: 'did:atp:verified:def456',
    organization: 'DataOps Inc',
    description: 'Business-intelligence agent issuing read-only queries.',
    trustLevel: 'verified',
    trustScore: TRUST_SCORES.verified,
    status: 'active',
    riskFactors: RISK_FACTORS_BY_TIER.verified,
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    lastSeen: new Date(Date.now() - 18 * 60_000).toISOString()
  }
];

// Module-scoped store. Initialized with seed agents; new agents are
// pushed in by the onboard route.
const store = new Map<string, DemoAgent>(
  SEED_AGENTS.map((a) => [a.id, a])
);

export function listAgents(): DemoAgent[] {
  return Array.from(store.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getAgent(id: string): DemoAgent | undefined {
  return store.get(id);
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

export function createAgent(input: CreateAgentInput): DemoAgent {
  const slug = slugify(input.name) || 'agent';
  const id = `${slug}-${Date.now().toString(36)}`;
  const trustLevel: TrustTier = input.trustLevel ?? 'basic';
  const now = new Date().toISOString();
  const agent: DemoAgent = {
    id,
    name: input.name,
    did: input.did?.trim() || `did:atp:${id}`,
    organization: input.organization?.trim() ?? '',
    description: input.description?.trim() ?? '',
    trustLevel,
    trustScore: TRUST_SCORES[trustLevel],
    status: 'active',
    riskFactors: RISK_FACTORS_BY_TIER[trustLevel],
    createdAt: now,
    lastSeen: now
  };
  store.set(id, agent);
  return agent;
}
