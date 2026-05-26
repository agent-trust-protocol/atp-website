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

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string | null;
  status: 'running' | 'pending' | 'queued' | 'success' | 'failed' | 'cancelled';
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  triggeredBy: string | null;
  triggerType: string | null;
  errorMessage: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  running: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  queued: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === 'cancelled') return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
}

export default function WorkflowRunsPage() {
  const me = useMe();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');
      const r = await fetch(`/api/workflows/executions?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setExecutions(data.executions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = executions.filter((e) => {
    if (!textFilter.trim()) return true;
    const q = textFilter.toLowerCase();
    return (
      (e.workflowName ?? '').toLowerCase().includes(q) ||
      (e.triggerType ?? '').toLowerCase().includes(q) ||
      (e.errorMessage ?? '').toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  });

  const counts = {
    success: filtered.filter((e) => e.status === 'success').length,
    failed: filtered.filter((e) => e.status === 'failed').length,
    running: filtered.filter((e) => e.status === 'running' || e.status === 'pending' || e.status === 'queued').length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/workflows">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to workflows
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="h-7 w-7 text-primary" />
                Workflow runs
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Recent executions across every workflow you can see.
                Manual runs, scheduled cron firings, webhook ingresses,
                and policy-violation events all land here.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
              <CardDescription>
                {me.isFounder ? 'Founder view — every execution in the system.' : 'Executions of workflows you created.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="text-filter" className="text-xs text-muted-foreground">
                  Text filter (workflow / trigger / error / id)
                </label>
                <div className="relative mt-1">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="text-filter"
                    value={textFilter}
                    onChange={(e) => setTextFilter(e.target.value)}
                    placeholder="search…"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="status-filter" className="text-xs text-muted-foreground">Status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Success" value={counts.success} color="green" />
            <StatCard label="Failed" value={counts.failed} color="red" />
            <StatCard label="In flight" value={counts.running} color="blue" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Runs ({filtered.length})</CardTitle>
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
                  No runs match the current filter. Try clearing it or running a workflow from <code className="font-mono text-xs">/dashboard/workflows</code>.
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((e) => (
                    <Link
                      key={e.id}
                      href={`/dashboard/workflows/executions/${e.id}`}
                      className="block border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusIcon status={e.status} />
                          <Badge variant="outline" className={STATUS_COLOR[e.status] ?? ''}>
                            {e.status}
                          </Badge>
                          <span className="font-medium truncate">{e.workflowName ?? '(deleted workflow)'}</span>
                          {e.triggerType && (
                            <span className="text-xs text-muted-foreground">· {e.triggerType}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {e.duration != null && `${e.duration} ms · `}
                          {e.startTime ? new Date(e.startTime).toLocaleString() : ''}
                        </div>
                      </div>
                      {e.errorMessage && (
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-mono whitespace-pre-wrap">
                          {e.errorMessage}
                        </p>
                      )}
                    </Link>
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

function StatCard({ label, value, color }: { label: string; value: number; color: 'green' | 'red' | 'blue' }) {
  const colorMap = {
    green: 'text-green-600',
    red: 'text-red-600',
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
