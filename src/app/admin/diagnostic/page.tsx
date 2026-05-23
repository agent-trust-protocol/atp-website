'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Mail,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Diagnostic {
  authenticated: boolean;
  user: { id: string; email: string; name: string | null } | null;
  isFounder: boolean;
  checks: {
    founderEmailConfigured: boolean;
    sessionEmailPresent: boolean;
    emailMatches: boolean;
  };
  hint: string;
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-green-600" />
  ) : (
    <XCircle className="h-5 w-5 text-red-600" />
  );
}

export default function FounderDiagnosticPage() {
  const [data, setData] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/diagnostic', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load diagnostic'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            Founder mode diagnostic
          </h1>
          <p className="text-muted-foreground mt-2">
            Why founder mode is or isn&apos;t kicking in, in plain English.
            Nothing here exposes secrets &mdash; the FOUNDER_EMAIL value
            stays on the server.
          </p>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading&hellip;
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="py-6 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="space-y-6">
            <Card className={data.isFounder ? 'border-green-300 bg-green-50/30 dark:bg-green-900/10' : 'border-yellow-300 bg-yellow-50/30 dark:bg-yellow-900/10'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Verdict</CardTitle>
                    <CardDescription className="mt-2">{data.hint}</CardDescription>
                  </div>
                  <Badge variant="outline" className={data.isFounder ? 'bg-green-500/10 text-green-700 border-green-500/40' : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/40'}>
                    {data.isFounder ? 'Founder bypass ACTIVE' : 'Founder bypass INACTIVE'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checks</CardTitle>
                <CardDescription>What we look at and what we found.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CheckRow
                  icon={<Mail className="h-4 w-4" />}
                  label="You're signed in"
                  ok={data.authenticated}
                  detail={
                    data.authenticated
                      ? `Session email: ${data.user?.email ?? '(missing)'}`
                      : 'No active Better Auth session for this browser.'
                  }
                />
                <CheckRow
                  icon={<KeyRound className="h-4 w-4" />}
                  label="FOUNDER_EMAIL is configured"
                  ok={data.checks.founderEmailConfigured}
                  detail={
                    data.checks.founderEmailConfigured
                      ? 'Set on the server (value hidden).'
                      : 'Not set on this deployment. Add it in Vercel project settings and redeploy.'
                  }
                />
                <CheckRow
                  icon={<Shield className="h-4 w-4" />}
                  label="Your email matches FOUNDER_EMAIL"
                  ok={data.checks.emailMatches}
                  detail={
                    data.checks.emailMatches
                      ? 'Case-insensitive match against the server value.'
                      : 'No match. Either sign in with the founder account, or update FOUNDER_EMAIL to match the email above.'
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Try a gated surface</CardTitle>
                <CardDescription>
                  If the bypass is active, these should open without prompting to sign up.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/api-reference">
                    /api-reference <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/cloud">
                    /cloud <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/demos">
                    /demos (quantum demo) <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckRow({
  icon,
  label,
  ok,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <StatusIcon ok={ok} />
      <div className="flex-1 min-w-0">
        <div className="font-medium flex items-center gap-2">
          {icon}
          {label}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </div>
    </div>
  );
}
