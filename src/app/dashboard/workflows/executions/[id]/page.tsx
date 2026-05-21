import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  Calendar,
  Activity,
  AlertTriangle,
  SkipForward
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getExecutionDetail } from '@/lib/workflows/execute';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  running: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  skipped: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === 'skipped') return <SkipForward className="h-4 w-4 text-gray-500" />;
  return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
}

export default async function ExecutionDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  const detail = await getExecutionDetail(params.id, viewer);
  if (!detail) notFound();

  const { execution, workflow, nodes } = detail;
  const startedAt = execution.startTime ? new Date(execution.startTime) : null;
  const endedAt = execution.endTime ? new Date(execution.endTime) : null;
  const sortedNodes = [...nodes].sort(
    (a, b) => (a.startTime ? new Date(a.startTime).getTime() : 0) - (b.startTime ? new Date(b.startTime).getTime() : 0)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/workflows/executions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="h-7 w-7 text-primary" />
                Execution
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                <Link href={`/dashboard/workflows`} className="hover:underline">
                  {workflow.name}
                </Link>{' '}
                <span className="font-mono text-xs">· v{workflow.version}</span>
              </p>
            </div>
            <Badge variant="outline" className={STATUS_COLOR[execution.status] ?? STATUS_COLOR.skipped}>
              <StatusIcon status={execution.status} />
              <span className="ml-1.5">{execution.status}</span>
            </Badge>
          </div>

          {execution.errorMessage && (
            <Card className="border-red-200 bg-red-50/40 dark:bg-red-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-mono text-red-900 dark:text-red-300">
                  {execution.errorMessage}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Trigger: {execution.triggerType ?? 'manual'}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Execution ID" value={<code className="font-mono text-xs">{execution.id}</code>} />
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Workflow ID" value={<code className="font-mono text-xs">{execution.workflowId}</code>} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Started" value={startedAt ? startedAt.toLocaleString() : '—'} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Ended" value={endedAt ? endedAt.toLocaleString() : '—'} />
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Duration" value={execution.duration != null ? `${execution.duration} ms` : '—'} />
              <DetailRow icon={<Activity className="h-4 w-4" />} label="Triggered by" value={execution.triggeredBy ?? '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node executions ({sortedNodes.length})</CardTitle>
              <CardDescription>In the order they were processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedNodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No nodes were executed.</p>
              ) : (
                sortedNodes.map((n) => (
                  <div
                    key={n.id}
                    className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={n.status} />
                        <span className="font-medium">{n.nodeType}</span>
                        <code className="text-xs text-muted-foreground font-mono">{n.nodeId}</code>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {n.duration != null ? `${n.duration} ms` : ''}
                      </span>
                    </div>
                    {n.errorMessage && (
                      <pre className="text-xs whitespace-pre-wrap font-mono text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 rounded p-2 mb-2">
                        {n.errorMessage}
                      </pre>
                    )}
                    {n.outputData != null && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">output</summary>
                        <pre className="mt-2 whitespace-pre-wrap font-mono bg-muted/40 rounded p-2 overflow-x-auto">
                          {JSON.stringify(n.outputData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
