'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExecutionDetail {
  executionId: string;
  workflowId: string;
  workflowName: string;
  state: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime: string | null;
  duration: number | null;
  initialData: unknown;
  result: unknown;
  error: string | null;
  completedNodes: string[];
}

const STATE_ICON: Record<ExecutionDetail['state'], React.ReactNode> = {
  running: <Activity className="h-4 w-4 text-blue-500 animate-pulse" />,
  completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  cancelled: <Clock className="h-4 w-4 text-muted-foreground" />
};

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  return `${(ms / 60_000).toFixed(2)} min`;
}

export default function ExecutionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [exec, setExec] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/workflows/executions/${id}`, { credentials: 'include' });
        if (res.status === 404) { if (!cancelled) setError('Execution not found.'); return; }
        if (res.status === 401) { if (!cancelled) setError('Sign in to view this execution.'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setExec(data.execution);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load execution');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/dashboard/workflows/executions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to executions
        </Link>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && error && !exec && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {exec && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {STATE_ICON[exec.state]} {exec.workflowName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {exec.executionId}
                    </p>
                  </div>
                  <Badge variant="outline">{exec.state}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Started</dt>
                    <dd className="font-medium">{new Date(exec.startTime).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Ended</dt>
                    <dd className="font-medium">
                      {exec.endTime ? new Date(exec.endTime).toLocaleString() : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-medium">{formatDuration(exec.duration)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nodes completed</dt>
                    <dd className="font-medium">{exec.completedNodes.length}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Workflow</dt>
                    <dd>
                      <Link
                        href={`/dashboard/workflows/designer?id=${exec.workflowId}`}
                        className="font-medium text-primary underline"
                      >
                        Open in designer →
                      </Link>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {exec.error && (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-destructive text-base">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap break-words text-destructive">{exec.error}</pre>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Initial data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(exec.initialData ?? {}, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Result</CardTitle>
              </CardHeader>
              <CardContent>
                {exec.result ? (
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(exec.result, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No result yet.</p>
                )}
              </CardContent>
            </Card>

            {exec.completedNodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Completed nodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm font-mono space-y-1">
                    {exec.completedNodes.map((n) => (
                      <li key={n} className="text-muted-foreground">{n}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
