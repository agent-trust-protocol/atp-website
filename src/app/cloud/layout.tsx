import { headers } from 'next/headers';
import { CloudAccessGate } from '@/components/auth/CloudAccessGate';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';

export default async function CloudLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Previous implementation checked an `atp_token` cookie and called
  // ATP_AUTH_SERVICE_URL/auth/verify — neither of which exist in the
  // production stack, so this gate never opened. Source of truth is now
  // the Better Auth session. Founder bypasses unconditionally so the
  // live Cloud surface can be QA'd end-to-end.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  if (!session?.user && !isFounderSession(session)) {
    return <CloudAccessGate feature="cloud-platform" tier="startup" />;
  }

  return <>{children}</>;
}
