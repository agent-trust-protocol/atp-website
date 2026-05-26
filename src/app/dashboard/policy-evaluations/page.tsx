'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Activity,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMe } from '@/hooks/use-me';

interface Evaluation {
  id: string;
  policyId: string;
  policyName: string | null;
  decision: 'allow' | 'deny' | 'throttle' | 'require_approval';
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  reason: string | null;
  context: unknown;
  evaluatedBy: string | null;
  processingTimeMs: number;
  evaluatedAt: string;
}

const DECISION_COLOR: Record<string, string> = {
  allow: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  deny: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  throttle: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  require_approval: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
};

function DecisionIcon({ decision }: { decision: string }) {
  if (decision === 'allow') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (decision === 'deny') return <XCircle className="h-4 w-4 text-red-600" />;
  if (decision === 'throttle') return <Clock className="h-4 w-4 text-yellow-600" />;
  return <AlertTriangle className="h-4 w-4 text-blue-600" />;
}

export default function PolicyEvaluationsPage() {
  const me = useMe();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [policyIdFilter, setPolicyIdFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (policyIdFilter.trim()) params.set('policyId', policyIdFilter.trim());
      params.set('limit', '100');
      const r = await fetch(`/api/policies/evaluations?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setEvaluations(data.evaluations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyIdFilter]);

  const filtered = evaluations.filter((e) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      (e.policyName ?? '').toLowerCase().includes(q) ||
      (e.matchedRuleName ?? '').toLowerCase().includes(q) ||
      (e.reason ?? '').toLowerCase().includes(q) ||
      e.decision.includes(q)
    );
  });

  const counts = {
    allow: filtered.filter((e) => e.decision === 'allow').length,
    deny: filtered.filter((e) => e.decision === 'deny').length,
    throttle: filtered.filter((e) => e.decision === 'throttle').length,
    require_approval: filtered.filter((e) => e.decision === 'require_approval').length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/policy-editor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to editor
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="h-7 w-7 text-primary" />
                Policy evaluations
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Recent decisions from the policy engine. Persisted when{' '}
                <code className="text-xs font-mono">persist: true</code> is sent to{' '}
                <code className="text-xs font-mono">/api/policies/[id]/evaluate</code> or by the{' '}
                <code className="text-xs font-mono">evaluate-policy</code> workflow node.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
              <CardDescription>
                {me.isFounder
                  ? 'Founder view — every evaluation in the system.'
                  : 'Evaluations of policies you own.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="text-filter" className="text-xs text-muted-foreground">
                  Text filter (policy / rule / reason)
                </label>
                <div className="relative mt-1">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="text-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="search…"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="policy-id-filter" className="text-xs text-muted-foreground">
                  Filter by policy ID
                </label>
                <Input
                  id="policy-id-filter"
                  value={policyIdFilter}
                  onChange={(e) => setPolicyIdFilter(e.target.value)}
                  placeholder="<uuid> or leave blank"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Allow" value={counts.allow} color="green" />
            <StatCard label="Deny" value={counts.deny} color="red" />
            <StatCard label="Throttle" value={counts.throttle} color="yellow" />
            <StatCard label="Require approval" value={counts.require_approval} color="blue" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evaluations ({filtered.length})</CardTitle>
              <CardDescription>Most recent first. Up to 100 shown.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No evaluations yet. Run a policy via <code className="font-mono text-xs">/policy-testing</code> or have a workflow's <code className="font-mono text-xs">evaluate-policy</code> node fire one.
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((e) => (
                    <div
                      key={e.id}
                      className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <DecisionIcon decision={e.decision} />
                          <Badge variant="outline" className={DECISION_COLOR[e.decision] ?? ''}>
                            {e.decision}
                          </Badge>
                          <span className="font-medium">{e.policyName ?? '(deleted policy)'}</span>
                          {e.matchedRuleName && (
                            <span className="text-xs text-muted-foreground">
                              · matched <code className="font-mono">{e.matchedRuleName}</code>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {e.processingTimeMs} ms · {new Date(e.evaluatedAt).toLocaleString()}
                        </div>
                      </div>
                      {e.reason && (
                        <p className="text-xs text-muted-foreground italic mb-2">{e.reason}</p>
                      )}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          context
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap font-mono bg-muted/40 rounded p-2 overflow-x-auto">
                          {JSON.stringify(e.context, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'green' | 'red' | 'yellow' | 'blue' }) {
  const colorMap = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600'
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${colorMap[color]}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
