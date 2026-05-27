/**
 * Viewer — the resolved identity for an incoming request. Every store helper
 * that touches user-scoped data should accept a Viewer and apply scoping:
 *   - anonymous (userId null, isFounder false) → empty list
 *   - member    (userId set,  isFounder false) → rows WHERE owner = userId
 *   - founder   (any userId,  isFounder true)  → all rows
 */

import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';

export interface Viewer {
  userId: string | null;
  isFounder: boolean;
  email: string | null;
}

export async function getViewer(headers: Headers): Promise<Viewer> {
  try {
    const session = await auth.api.getSession({ headers });
    return {
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      isFounder: isFounderSession(session)
    };
  } catch {
    return { userId: null, email: null, isFounder: false };
  }
}
