import { headers as nextHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';

export interface Viewer {
  userId: string | null;
  isFounder: boolean;
}

/**
 * Resolve the current viewer (user + founder flag) from Better Auth, working
 * in both Route Handlers (pass `req.headers`) and React Server Components
 * (pass nothing — falls back to next/headers). Anonymous viewers get
 * `{ userId: null, isFounder: false }`.
 */
export async function getViewer(reqHeaders?: Headers): Promise<Viewer> {
  const h = reqHeaders ?? (await nextHeaders());
  const session = await auth.api.getSession({ headers: h }).catch(() => null);
  return {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };
}
