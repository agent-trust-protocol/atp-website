import { Pool } from 'pg';

/**
 * Shared PostgreSQL connection pool for the application.
 * Uses DATABASE_URL from environment variables.
 *
 * In development: connects to local PostgreSQL
 * In production: connects to managed PostgreSQL (e.g., Neon, Supabase, RDS)
 */

const {DATABASE_URL} = process.env;

// Only warn at runtime, not during build
if (!DATABASE_URL && typeof globalThis !== 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn(
    '[DB] DATABASE_URL not set. Database features will not work.\n' +
    'Set DATABASE_URL=postgresql://user:pass@host:5432/dbname in your .env file.'
  );
}

// Create a singleton pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is required. ' +
        'Set it in your .env file: DATABASE_URL=postgresql://user:pass@host:5432/dbname'
      );
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // SSL: disabled for local dev and Fly internal network; enabled for external DBs
      ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('sslmode=disable') || DATABASE_URL.includes('.flycast')
        ? false
        : { rejectUnauthorized: false }
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });
  }
  return pool;
}

/**
 * Execute a parameterized query against the database.
 * Uses connection pooling for efficient resource management.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a query and return the first row or null.
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the number of affected rows.
 */
export async function execute(text: string, params?: any[]): Promise<number> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}

/**
 * Initialize the application tables (api_keys, user_settings, etc.)
 * Better Auth creates its own tables (user, session, account, verification).
 * This function creates the additional tables our app needs.
 */
export async function initializeAppTables(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      permissions TEXT[] DEFAULT ARRAY['read:agents', 'read:credentials'],
      environment TEXT NOT NULL DEFAULT 'development',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      rate_limit_rpm INTEGER NOT NULL DEFAULT 100,
      rate_limit_rpd INTEGER NOT NULL DEFAULT 10000,
      description TEXT,
      ip_whitelist TEXT[],
      CONSTRAINT valid_status CHECK (status IN ('active', 'revoked', 'expired')),
      CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production'))
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      organization_name TEXT,
      webhook_url TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      company TEXT NOT NULL,
      company_size TEXT NOT NULL,
      role TEXT NOT NULL,
      use_case TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      CONSTRAINT valid_waitlist_status CHECK (status IN ('pending', 'approved', 'rejected'))
    );

    CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
    CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      waitlist_id TEXT REFERENCES waitlist(id) ON DELETE SET NULL,
      used_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
    CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

    CREATE TABLE IF NOT EXISTS agents (
      id            TEXT PRIMARY KEY,
      owner_user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      did           TEXT NOT NULL,
      organization  TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      trust_level   TEXT NOT NULL DEFAULT 'basic',
      trust_score   DOUBLE PRECISION NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'active',
      risk_factors  TEXT[] NOT NULL DEFAULT '{}',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_trust_level CHECK (trust_level IN ('untrusted','basic','verified','premium','enterprise')),
      CONSTRAINT valid_agent_status CHECK (status IN ('active','inactive','suspended'))
    );

    CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

    -- Tenants (Phase 3): lightweight 1:1 model — one tenant per user via
    -- the user_tenants join. The join is created up front so multi-user
    -- support later is a permissions change, not a schema rewrite.
    CREATE TABLE IF NOT EXISTS tenants (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      plan       TEXT NOT NULL DEFAULT 'free',
      status     TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT valid_tenant_status CHECK (status IN ('active','suspended','archived'))
    );

    CREATE TABLE IF NOT EXISTS user_tenants (
      user_id   TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      role      TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, tenant_id),
      CONSTRAINT valid_tenant_role CHECK (role IN ('owner','admin','member'))
    );

    CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);

    -- Policies (Phase 4): replaces the previous reliance on an external
    -- atp-permission service. The full policy IR (nodes, edges, rules,
    -- tags) lives in the document JSONB column; everything else is
    -- metadata for the dashboard list view.
    CREATE TABLE IF NOT EXISTS policies (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      version       TEXT NOT NULL DEFAULT '1.0.0',
      document      JSONB NOT NULL,
      enabled       BOOLEAN NOT NULL DEFAULT TRUE,
      tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_policies_owner ON policies(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_policies_enabled ON policies(enabled);

    -- Workflow engine tables (typed via Drizzle in src/workflow-engine/database/schema.ts).
    -- Raw SQL matches the convention used by every other table in this file; introducing
    -- drizzle-kit migrations is deferred until we have a migration story for Vercel.
    CREATE TABLE IF NOT EXISTS workflows (
      id          UUID PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      version     VARCHAR(50) NOT NULL DEFAULT '1.0.0',
      definition  JSONB NOT NULL,
      status      VARCHAR(50) NOT NULL DEFAULT 'draft',
      created_by  VARCHAR(255),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_template BOOLEAN NOT NULL DEFAULT FALSE,
      category    VARCHAR(100),
      tags        JSONB DEFAULT '[]'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

    CREATE TABLE IF NOT EXISTS workflow_executions (
      id              UUID PRIMARY KEY,
      workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      workflow_version VARCHAR(50) NOT NULL,
      status          VARCHAR(50) NOT NULL,
      start_time      TIMESTAMPTZ NOT NULL,
      end_time        TIMESTAMPTZ,
      duration        INTEGER,
      triggered_by    VARCHAR(255),
      trigger_type    VARCHAR(100),
      input_data      JSONB,
      output_data     JSONB,
      error_message   TEXT,
      metadata        JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

    CREATE TABLE IF NOT EXISTS node_executions (
      id            UUID PRIMARY KEY,
      execution_id  UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
      node_id       VARCHAR(255) NOT NULL,
      node_type     VARCHAR(100) NOT NULL,
      status        VARCHAR(50) NOT NULL,
      start_time    TIMESTAMPTZ NOT NULL,
      end_time      TIMESTAMPTZ,
      duration      INTEGER,
      input_data    JSONB,
      output_data   JSONB,
      error_message TEXT,
      retry_count   INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_node_executions_execution ON node_executions(execution_id);

    CREATE TABLE IF NOT EXISTS workflow_variables (
      id          UUID PRIMARY KEY,
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      name        VARCHAR(255) NOT NULL,
      type        VARCHAR(50) NOT NULL,
      value       JSONB,
      is_secret   BOOLEAN NOT NULL DEFAULT FALSE,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflow_triggers (
      id             UUID PRIMARY KEY,
      workflow_id    UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      type           VARCHAR(100) NOT NULL,
      name           VARCHAR(255) NOT NULL,
      configuration  JSONB NOT NULL,
      is_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
      last_triggered TIMESTAMPTZ,
      trigger_count  INTEGER NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflow_stats (
      id                    UUID PRIMARY KEY,
      workflow_id           UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      total_executions      INTEGER NOT NULL DEFAULT 0,
      successful_executions INTEGER NOT NULL DEFAULT 0,
      failed_executions     INTEGER NOT NULL DEFAULT 0,
      average_duration      NUMERIC(10, 2),
      last_execution_time   TIMESTAMPTZ,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS node_stats (
      id                    UUID PRIMARY KEY,
      workflow_id           UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      node_id               VARCHAR(255) NOT NULL,
      node_type             VARCHAR(100) NOT NULL,
      total_executions      INTEGER NOT NULL DEFAULT 0,
      successful_executions INTEGER NOT NULL DEFAULT 0,
      failed_executions     INTEGER NOT NULL DEFAULT 0,
      average_duration      NUMERIC(10, 2),
      last_execution_time   TIMESTAMPTZ,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          UUID PRIMARY KEY,
      entity_type VARCHAR(100) NOT NULL,
      entity_id   UUID NOT NULL,
      action      VARCHAR(100) NOT NULL,
      user_id     VARCHAR(255),
      user_name   VARCHAR(255),
      changes     JSONB,
      metadata    JSONB,
      ip_address  VARCHAR(45),
      user_agent  TEXT,
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS policy_workflows (
      id            UUID PRIMARY KEY,
      policy_id     VARCHAR(255) NOT NULL,
      workflow_id   UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      trigger_event VARCHAR(100) NOT NULL,
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      priority      INTEGER NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trust_workflows (
      id            UUID PRIMARY KEY,
      agent_did     VARCHAR(500),
      workflow_id   UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      trigger_event VARCHAR(100) NOT NULL,
      thresholds    JSONB,
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export default { getPool, query, queryOne, execute, initializeAppTables };
