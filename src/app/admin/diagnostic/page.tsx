'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface MeResponse {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  isFounder: boolean;
  founderEmailConfigured: boolean;
}

interface Probe {
  label: string;
  endpoint: string;
  ok: boolean | null;
  detail: string;
}

const PROBES: Array<{ label: string; endpoint: string }> = [
  { label: 'Workflows', endpoint: '/api/workflows' },
  { label: 'Agents', endpoint: '/api/agents' },
  { label: 'Tenants', endpoint: '/api/tenants' },
  { label: 'Policies', endpoint: '/api/policies' }
];

function Row({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }) {
  const color =
    tone === 'ok' ? 'text-green-600' :
    tone === 'bad' ? 'text-destructive' :
    tone === 'warn' ? 'text-yellow-600' :
    '';
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono ${color}`}>{value}</span>
    </div>
  );
}

export default function DiagnosticPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [probes, setProbes] = useState<Probe[]>(
    PROBES.map((p) => ({ ...p, ok: null, detail: '…' }))
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMe(await res.json());
      } catch (e) {
        setMeError(e instanceof Error ? e.message : 'Failed to load /api/me');
      }
    })();

    PROBES.forEach(async (p, i) => {
      try {
        const res = await fetch(p.endpoint, { credentials: 'include' });
        setProbes((prev) => {
          const next = [...prev];
          next[i] = {
            ...p,
            ok: res.ok,
            detail: res.ok ? `${res.status} OK` : `${res.status} ${res.statusText || ''}`.trim()
          };
          return next;
        });
      } catch (e) {
        setProbes((prev) => {
          const next = [...prev];
          next[i] = { ...p, ok: false, detail: e instanceof Error ? e.message : 'fetch failed' };
          return next;
        });
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Diagnostic</h1>
          <p className="text-sm text-muted-foreground">
            Identity + endpoint health, useful for confirming founder mode and DB
            connectivity in any deployment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>From /api/me — reflects the Better Auth session on this request.</CardDescription>
          </CardHeader>
          <CardContent>
            {meError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {meError}
              </div>
            )}
            {me && (
              <div className="space-y-0">
                <Row
                  label="Authenticated"
                  value={String(me.authenticated)}
                  tone={me.authenticated ? 'ok' : 'warn'}
                />
                <Row label="User ID" value={me.userId ?? '—'} />
                <Row label="Email" value={me.email ?? '—'} />
                <Row
                  label="FOUNDER_EMAIL configured"
                  value={String(me.founderEmailConfigured)}
                  tone={me.founderEmailConfigured ? 'ok' : 'warn'}
                />
                <Row
                  label="Founder mode active"
                  value={String(me.isFounder)}
                  tone={me.isFounder ? 'ok' : undefined}
                />
              </div>
            )}
            {!me && !meError && <p className="text-sm text-muted-foreground">Loading…</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoints</CardTitle>
            <CardDescription>
              Probes against each entity API. 401 here is expected when signed out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {probes.map((p) => (
              <div key={p.endpoint} className="flex items-center justify-between py-1.5 border-b last:border-b-0">
                <div className="flex items-center gap-2">
                  {p.ok === null ? (
                    <Badge variant="outline">…</Badge>
                  ) : p.ok ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">{p.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.endpoint}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{p.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
