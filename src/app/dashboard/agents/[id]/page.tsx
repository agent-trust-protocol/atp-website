import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAgent } from '@/lib/agents/store';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const TIER_BADGE: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
  premium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  basic: 'bg-blue-100 text-blue-800 border-blue-200',
  untrusted: 'bg-gray-100 text-gray-800 border-gray-200'
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200'
};

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const viewer = await getViewer();
  const agent = await getAgent(params.id, viewer);
  if (!agent) notFound();

  const scorePct = Math.round(agent.trustScore * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground font-mono text-xs mt-1">{agent.did}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Trust score
            </CardTitle>
            <CardDescription>
              Composite score across identity, behaviour, and credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold tabular-nums">{scorePct}</div>
              <div className="flex flex-col gap-2">
                <Badge className={TIER_BADGE[agent.trustLevel] ?? TIER_BADGE.untrusted}>
                  {agent.trustLevel}
                </Badge>
                <Badge className={STATUS_BADGE[agent.status] ?? STATUS_BADGE.inactive}>
                  {agent.status}
                </Badge>
              </div>
            </div>
            <div className="h-2 w-full rounded bg-muted">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${scorePct}%` }}
                aria-label={`Trust score ${scorePct} percent`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {agent.riskFactors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Risk factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agent.riskFactors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No risk factors flagged.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {agent.riskFactors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">Organization</div>
              <div className="font-medium">{agent.organization || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Created</div>
              <div className="font-medium">{new Date(agent.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last seen</div>
              <div className="font-medium">{new Date(agent.lastSeen).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Agent ID</div>
              <div className="font-mono text-xs">{agent.id}</div>
            </div>
            {agent.description && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground">Description</div>
                <div>{agent.description}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/policy-editor">Open policy editor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/agents">All agents</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
