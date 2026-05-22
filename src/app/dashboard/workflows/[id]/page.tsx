import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  GitBranch,
  Calendar,
  Hash,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getDb, schema } from '@/lib/workflows/db';
import { listExecutionsForWorkflow } from '@/lib/workflows/execute';
import { WorkflowTriggersPanel } from '@/components/workflows/workflow-triggers-panel';
import { eq } from 'drizzle-orm';

const { workflows } = schema;

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  archived: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
};

export default async function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  const db = getDb();
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, params.id)).limit(1);
  if (!wf) notFound();
  if (!viewer.isFounder && wf.createdBy !== viewer.userId) notFound();

  const recentExecutions = await listExecutionsForWorkflow(params.id, viewer);

  const definition = (wf.definition ?? {}) as { nodes?: unknown[]; edges?: unknown[] };
  const nodeCount = Array.isArray(definition.nodes) ? definition.nodes.length : 0;
  const edgeCount = Array.isArray(definition.edges) ? definition.edges.length : 0;

  // Origin for webhook URL display. `host` is set by Next on the incoming
  // request; fall back to env or empty (client builds relative URLs).
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const origin = host ? `${proto}://${host}` : '';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/workflows">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <GitBranch className="h-7 w-7 text-primary" />
                {wf.name}
              </h1>
              {wf.description && (
                <p className="text-muted-foreground text-sm mt-1">{wf.description}</p>
              )}
            </div>
            <Badge variant="outline" className={STATUS_COLOR[wf.status] ?? STATUS_COLOR.draft}>
              {wf.status}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Workflow definition + metadata.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Workflow ID" value={<code className="font-mono text-xs">{wf.id}</code>} />
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Version" value={wf.version} />
              <DetailRow icon={<Layers className="h-4 w-4" />} label="Nodes / edges" value={`${nodeCount} / ${edgeCount}`} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={new Date(wf.createdAt).toLocaleString()} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Updated" value={new Date(wf.updatedAt).toLocaleString()} />
            </CardContent>
          </Card>

          <WorkflowTriggersPanel workflowId={wf.id} origin={origin} />

          <Card>
            <CardHeader>
              <CardTitle>Recent executions ({recentExecutions.length})</CardTitle>
              <CardDescription>Up to the last 50 runs.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentExecutions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No runs yet. Click Run on the workflows list or wait for a trigger to fire.</p>
              ) : (
                <div className="space-y-2">
                  {recentExecutions.map((exec) => (
                    <Link
                      key={exec.id}
                      href={`/dashboard/workflows/executions/${exec.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={STATUS_COLOR[exec.status] ?? ''}>
                          {exec.status}
                        </Badge>
                        <code className="font-mono text-xs text-muted-foreground">{exec.id.slice(0, 8)}</code>
                        <span className="text-xs text-muted-foreground">
                          {exec.triggerType ?? 'manual'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exec.duration != null && `${exec.duration} ms · `}
                        {exec.startTime ? new Date(exec.startTime).toLocaleString() : ''}
                      </div>
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
