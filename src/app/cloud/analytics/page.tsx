import Link from 'next/link';
import { headers } from 'next/headers';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Globe,
  Clock,
  Calendar,
  Cloud,
  Hammer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Subnav } from '@/components/ui/subnav';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getCloudAnalytics, type TimeRange } from '@/lib/cloud/analytics';

export const dynamic = 'force-dynamic';

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'Last 24 hours',
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days'
};

function parseRange(v: string | undefined): TimeRange {
  return v === '24h' || v === '30d' || v === '90d' ? v : '7d';
}

export default async function AnalyticsPage({
  searchParams
}: { searchParams: { range?: string } }) {
  const range = parseRange(searchParams?.range);

  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  const analytics = await getCloudAnalytics(viewer, range);

  const cloudTabs = [
    { id: 'overview',  label: 'Overview',  href: '/cloud',           icon: <Cloud className="h-4 w-4" /> },
    { id: 'tenants',   label: 'Tenants',   href: '/cloud/tenants',   icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', href: '/cloud/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'services',  label: 'Services',  href: '/cloud/services',  icon: <Activity className="h-4 w-4" /> }
  ];
  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Analytics', href: '/cloud/analytics' }
  ];

  // Max bucket size for the bar chart — keeps bars visually proportional
  // without needing a real charting library.
  const maxHourly = Math.max(1, ...analytics.hourlyData.map((p) => p.requests));

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={cloudTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg glass border">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Workflow runs, durations, and success rate
                  {viewer.isFounder ? ' across the entire platform.' : ' for your workspace.'}
                </p>
              </div>
            </div>

            <form className="flex items-center gap-2" action="/cloud/analytics" method="GET">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                name="range"
                defaultValue={range}
                className="bg-background border border-border rounded-md px-3 py-1 text-sm"
              >
                {(Object.keys(RANGE_LABELS) as TimeRange[]).map((k) => (
                  <option key={k} value={k}>{RANGE_LABELS[k]}</option>
                ))}
              </select>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <OverviewCard
              label="Workflow runs"
              value={analytics.overview.totalRequests.toLocaleString()}
              delta={analytics.overview.requestGrowth}
              icon={<Activity className="h-5 w-5 text-primary" />}
              tone="primary"
            />
            <OverviewCard
              label="Avg run time"
              value={analytics.overview.avgResponseTime === 0
                ? '—'
                : `${analytics.overview.avgResponseTime} ms`}
              delta={analytics.overview.responseTimeChange}
              deltaInverse
              icon={<Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
              tone="orange"
            />
            <OverviewCard
              label="Active tenants"
              value={analytics.overview.activeTenants.toString()}
              delta={analytics.overview.tenantGrowth}
              icon={<Users className="h-5 w-5 text-green-600 dark:text-green-400" />}
              tone="green"
            />
            <OverviewCard
              label="Success rate"
              value={`${analytics.overview.uptime}%`}
              icon={<Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
              tone="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Hourly volume (last 24h)
                </CardTitle>
                <CardDescription>Workflow runs per hour</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.hourlyData.length === 0 ? (
                  <EmptyHint message="No runs in the last 24 hours yet." />
                ) : (
                  <div className="space-y-4">
                    {analytics.hourlyData.map((point) => (
                      <div key={point.hour} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground w-16">{point.hour}</span>
                        <div className="flex-1 mx-4">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${(point.requests / maxHourly) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {point.requests.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top tenants
                </CardTitle>
                <CardDescription>By audit-log activity in the window</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topTenants.length === 0 ? (
                  <EmptyHint message="No tenant activity in this window yet." />
                ) : (
                  <div className="space-y-4">
                    {analytics.topTenants.map((tenant, idx) => (
                      <div
                        key={`${tenant.name}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.requests.toLocaleString()} events
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground text-center">
            "Workflow runs" maps to <code>workflow_executions</code>. "Top tenants" is derived from
            <code> audit_logs</code> activity in the selected window.{' '}
            <Link href="/dashboard/workflows/executions" className="underline">See raw runs →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  label, value, delta, deltaInverse, icon, tone
}: {
  label: string;
  value: string;
  delta?: number;
  deltaInverse?: boolean;
  icon: React.ReactNode;
  tone: 'primary' | 'orange' | 'green' | 'purple';
}) {
  const toneCls = {
    primary: 'bg-primary/10',
    orange:  'bg-orange-100 dark:bg-orange-900/20',
    green:   'bg-green-100 dark:bg-green-900/20',
    purple:  'bg-purple-100 dark:bg-purple-900/20'
  }[tone];
  // For "lower is better" metrics like response time, flip the color logic.
  const isUp = (delta ?? 0) > 0;
  const positive = deltaInverse ? !isUp : isUp;
  const deltaCls = (delta ?? 0) === 0
    ? 'text-muted-foreground'
    : positive ? 'text-green-500' : 'text-red-500';
  return (
    <Card className="glass border hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {delta !== undefined && (
              <div className={`flex items-center mt-1 ${deltaCls}`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${isUp ? '' : 'rotate-180'}`} />
                <span className="text-xs">{Math.abs(delta)}%</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${toneCls}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <Hammer className="h-5 w-5 mx-auto mb-2 opacity-60" />
      {message}
    </div>
  );
}
