import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';
import type { Session } from './auth';

// In the browser, always use the current origin so auth requests are same-origin.
// This avoids CORS preflight issues when Vercel redirects between www and non-www.
// On the server (SSR / RSC), fall back to env vars.
const baseURL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL,
  plugins: [magicLinkClient()]
});

export const {
  signIn,
  signUp,
  signOut,
  useSession
} = authClient;

// Social sign-in helpers
export const signInWithGoogle = () => {
  return authClient.signIn.social({ provider: 'google' });
};

export const signInWithGithub = () => {
  return authClient.signIn.social({ provider: 'github' });
};

function getSafeReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/portal';
  }

  return returnTo;
}

// Magic link sign-in — Better Auth first verifies the token at
// /api/auth/magic-link/verify, then redirects here after the session cookie is set.
export const signInWithMagicLink = (email: string, returnTo?: string) => {
  const dest = getSafeReturnTo(returnTo);
  const callbackURL = `/auth/callback?returnTo=${encodeURIComponent(dest)}`;
  return authClient.signIn.magicLink({
    email,
    callbackURL,
    errorCallbackURL: callbackURL
  });
};

// Helper hooks for common auth operations
export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user,
    session: session.data?.session,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user
  };
}

// Type-safe session hook
export function useAuthSession() {
  return useSession() as {
    data: Session | null;
    isPending: boolean;
    error: Error | null;
  };
}
