import Link from 'next/link';
import { headers } from 'next/headers';
import {
  Users,
  Activity,
  BarChart3,
  Settings,
  Database,
  Server,
  Zap,
  Globe,
  Building,
  CheckCircle,
  TrendingUp,
  Eye,
  Network,
  Cloud,
  Shield,
  Lock,
  Hammer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Subnav } from '@/components/ui/subnav';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getCloudStats } from '@/lib/cloud/stats';
import { listActivity, type ActivityEvent } from '@/lib/activity';
import { computeMonitoringSnapshot } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)} min`;
  return `${(ms / 3_600_000).toFixed(1)} h`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h ago`;
  return `${Math.floor(ms / 86_400_000)} d ago`;
}

function activityIcon(source: ActivityEvent['source']) {
  switch (source) {
    case 'workflow_execution': return <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'policy_evaluation':  return <Shield   className="h-4 w-4 text-primary" />;
    case 'tenant_invitation':  return <Users    className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    case 'audit_log':
    default:                   return <Network  className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
  }
}

export default async function CloudDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  // Parallelize the three independent reads — they all touch different
  // tables so this is wall-clock ~max(individual latency).
  const [stats, activity, snapshot] = await Promise.all([
    getCloudStats(viewer),
    listActivity(viewer, { limit: 5 }),
    computeMonitoringSnapshot().catch(() => null)
  ]);

  const cloudTabs = [
    { id: 'overview',  label: 'Overview',  href: '/cloud',           icon: <Cloud className="h-4 w-4" /> },
    { id: 'tenants',   label: 'Tenants',   href: '/cloud/tenants',   icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', href: '/cloud/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'services',  label: 'Services',  href: '/cloud/services',  icon: <Settings className="h-4 w-4" /> }
  ];

  const breadcrumbs = [{ label: 'Cloud Dashboard', href: '/cloud' }];

  // System status: derived from the live monitoring snapshot. Falls
  // back to a single "unknown" row if the snapshot itself failed.
  const services = snapshot?.data.services ?? [
    { name: 'Monitoring', status: 'degraded' as const, detail: 'snapshot unavailable' }
  ];
  const systemStatusBadge = (status: string) => {
    if (status === 'healthy') {
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
    if (status === 'degraded') {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    }
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  };

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={cloudTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg glass border">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  ATP™ Cloud Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {viewer.isFounder
                    ? 'Platform-wide view — you are seeing every tenant.'
                    : viewer.userId
                      ? 'Your Agent Trust Protocol™ workspace at a glance.'
                      : 'Sign in to see your workspace.'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid — real counts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Building className="w-6 h-6 text-primary" />}
              tone="primary"
              label={viewer.isFounder ? 'Total tenants' : 'Your tenants'}
              value={stats.totalTenants}
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
              tone="green"
              label="Active tenants"
              value={stats.activeTenants}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
              tone="purple"
              label="Workflow runs"
              value={stats.totalExecutions.toLocaleString()}
            />
            <StatCard
              icon={<Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
              tone="orange"
              label="Compute time"
              value={stats.totalExecutions === 0 ? '—' : formatDuration(stats.totalDurationMs)}
            />
          </div>

          {/* Quick Actions & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common cloud management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActionRow href="/cloud/tenants/new" tone="primary" icon={<Users className="h-4 w-4 text-primary" />}
                  title={stats.totalTenants === 0 ? 'Set up your tenant' : 'Update tenant settings'}
                  desc={stats.totalTenants === 0 ? 'Pick a name and subdomain to get started' : 'Rename or change your subdomain'} />
                <ActionRow href="/cloud/analytics" tone="green" icon={<BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  title="View analytics" desc="Workflow runs, durations, success rate" />
                <ActionRow href="/cloud/services" tone="purple" icon={<Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  title="Service status" desc="Live health of platform subsystems" />
              </CardContent>
            </Card>

            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>Real-time service health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span>{svc.name}</span>
                    </div>
                    <Badge variant="outline" className={systemStatusBadge(svc.status)}>
                      {svc.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity — real events */}
          <Card className="glass border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Live events from your workflows, policies, and tenant changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  <Hammer className="h-5 w-5 mx-auto mb-2 opacity-60" />
                  Nothing here yet. Run a workflow or edit a policy and it'll show up.
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.map((ev) => (
                    <Link
                      key={ev.id}
                      href={ev.href ?? '#'}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-full bg-background">
                        {activityIcon(ev.source)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ev.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {relativeTime(ev.timestamp)}
                          {ev.detail ? <> · {ev.detail}</> : null}
                        </p>
                      </div>
                      {ev.status && (
                        <Badge variant="outline" className="text-xs">{ev.status}</Badge>
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

/* ---------------------------------------------------------------- helpers */

function StatCard({
  icon, tone, label, value
}: { icon: React.ReactNode; tone: 'primary' | 'green' | 'purple' | 'orange'; label: string; value: number | string }) {
  const toneCls = {
    primary: 'bg-primary/10',
    green:   'bg-green-100 dark:bg-green-900/20',
    purple:  'bg-purple-100 dark:bg-purple-900/20',
    orange:  'bg-orange-100 dark:bg-orange-900/20'
  }[tone];
  return (
    <Card className="glass border hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${toneCls}`}>{icon}</div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionRow({
  href, tone, icon, title, desc
}: { href: string; tone: 'primary' | 'green' | 'purple'; icon: React.ReactNode; title: string; desc: string }) {
  const toneCls = {
    primary: 'bg-primary/10',
    green:   'bg-green-100 dark:bg-green-900/20',
    purple:  'bg-purple-100 dark:bg-purple-900/20'
  }[tone];
  return (
    <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
      <Link href={href}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${toneCls}`}>{icon}</div>
          <div className="text-left">
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
          </div>
        </div>
      </Link>
    </Button>
  );
}
