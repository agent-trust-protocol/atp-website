import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { Pool } from 'pg';

// BETTER_AUTH_SECRET is required at runtime in production.
// During `next build` the env is not available, so a placeholder is used for
// the build phase only — it is never used to sign real sessions.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
const secret = process.env.BETTER_AUTH_SECRET;

if (!secret && !isNextBuild) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] BETTER_AUTH_SECRET environment variable is not set. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  console.warn('[auth] BETTER_AUTH_SECRET not set — using insecure dev fallback. Never use this in production.');
}

const authSecret = secret ?? 'dev-only-secret-not-for-production';

// Authoritative source for the auth base URL.
// On Vercel preview deployments the canonical domain in BETTER_AUTH_URL does
// not match the actual `*.vercel.app` host the browser is on, so Better Auth
// would Set-Cookie for the wrong domain and the browser would silently drop
// it (resulting in successful-looking logins that produce no session). When
// VERCEL_ENV === 'preview' we use the per-deployment URL instead.
// Production keeps using BETTER_AUTH_URL → NEXT_PUBLIC_APP_URL.
const vercelUrl = process.env.VERCEL_URL;
const isVercelPreview = process.env.VERCEL_ENV === 'preview' && !!vercelUrl;
const baseURL = isVercelPreview
  ? `https://${vercelUrl}`
  : process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// PostgreSQL connection for Better Auth. Required in production; build-phase
// uses a no-pool placeholder so `next build` doesn't crash without DB creds.
const {DATABASE_URL} = process.env;

if (!DATABASE_URL && !isNextBuild && process.env.NODE_ENV === 'production') {
  throw new Error('[auth] DATABASE_URL environment variable is not set.');
}

const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('sslmode=disable') || DATABASE_URL.includes('.flycast')
    ? false
    : { rejectUnauthorized: false }
}) : undefined;

export type { Session } from 'better-auth';

export const auth = betterAuth({
  secret: authSecret,
  baseURL,
  database: pool as any, // Better Auth accepts a pg Pool directly
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30 // 30 days
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://agenttrustprotocol.com',
    'https://www.agenttrustprotocol.com',
    vercelUrl ? `https://${vercelUrl}` : '',
    process.env.NEXT_PUBLIC_APP_DOMAIN || ''
  ].filter(Boolean),
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Dynamic import to avoid circular dependency
        const { emailService } = await import('./email');
        const sent = await emailService.sendMagicLinkEmail(email, url);
        if (!sent) {
          throw new Error('Failed to send magic link email. Please try again.');
        }
      },
      expiresIn: 60 * 15 // 15 minutes
    })
  ]
});
