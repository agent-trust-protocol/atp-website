'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type SessionState =
  | { kind: 'checking' }
  | { kind: 'authed' }
  | { kind: 'no-session'; clientRes: unknown; serverStatus: number; serverBody: string }
  | { kind: 'error'; message: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ kind: 'checking' });

  useEffect(() => {
    (async () => {
      try {
        const clientRes = await authClient.getSession();
        if ((clientRes as any)?.data?.session) {
          setState({ kind: 'authed' });
          return;
        }
        // Raw call so we can see exactly what the server returns to the browser
        // (with the cookies the browser actually sent).
        const raw = await fetch('/api/auth/get-session', { credentials: 'include' });
        const text = await raw.text();
        setState({
          kind: 'no-session',
          clientRes,
          serverStatus: raw.status,
          serverBody: text.slice(0, 500)
        });
      } catch (err) {
        setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  }, []);

  if (state.kind === 'checking') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Verifying access…</div>
      </div>
    );
  }

  if (state.kind !== 'authed') {
    const cookieNames =
      typeof document !== 'undefined'
        ? document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter(Boolean).join(', ')
        : '(ssr)';
    const origin = typeof window !== 'undefined' ? window.location.origin : '(ssr)';
    const clientApiUrl =
      process.env.NEXT_PUBLIC_APP_URL || '(NEXT_PUBLIC_APP_URL unset at build time)';

    return (
      <div className="min-h-screen bg-black text-white p-8 font-mono text-xs leading-relaxed">
        <h1 className="text-yellow-400 text-lg mb-4 font-bold">Admin auth diagnostic</h1>
        <p className="mb-4 text-gray-400">
          No session detected on /admin. Below is the information needed to debug why.
          Copy this whole page back to the engineer.
        </p>

        <div className="space-y-4">
          <Section title="Browser context">
            <Line label="window.location.origin" value={origin} />
            <Line label="NEXT_PUBLIC_APP_URL (build-time)" value={clientApiUrl} />
            <Line label="JS-visible cookies (session cookie is HttpOnly and won't appear here)" value={cookieNames || '(none visible)'} />
          </Section>

          <Section title="Server response from /api/auth/get-session">
            {state.kind === 'no-session' ? (
              <>
                <Line label="HTTP status" value={String(state.serverStatus)} />
                <Line label="Body (truncated to 500 chars)" value={state.serverBody || '(empty)'} />
              </>
            ) : (
              <Line label="Error" value={state.message} />
            )}
          </Section>

          {state.kind === 'no-session' && (
            <Section title="authClient.getSession() raw result">
              <pre className="bg-gray-900 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(state.clientRes, null, 2)}
              </pre>
            </Section>
          )}
        </div>

        <p className="mt-6">
          <Link href="/admin/login" className="text-blue-400 underline">
            → Go to /admin/login
          </Link>
        </p>
        <p className="mt-2 text-gray-600">
          (This diagnostic page replaces the silent redirect so the failure mode is visible.
          Revert after diagnosis.)
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-yellow-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-3">
          <span className="font-bold">⚡ FOUNDER MODE</span>
          <span className="opacity-60">|</span>
          <Link href="/admin" className="hover:underline">
            Testing Hub
          </Link>
        </div>
        <button
          onClick={async () => {
            await authClient.signOut();
            window.location.href = '/admin/login';
          }}
          className="bg-black/10 hover:bg-black/20 rounded px-2 py-0.5 text-xs transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-800 rounded p-4 bg-gray-950">
      <h2 className="text-yellow-500/80 text-sm mb-2 font-bold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{' '}
      <span className="text-gray-200 break-all">{value}</span>
    </div>
  );
}
