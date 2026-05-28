import {
  Settings,
  Server,
  Database,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Users,
  Cloud,
  Hammer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Subnav } from '@/components/ui/subnav';
import { computeMonitoringSnapshot } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  healthy:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  down:     'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
};

function statusIcon(status: string) {
  if (status === 'healthy')  return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'degraded') return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  if (status === 'down')     return <XCircle    className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function serviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('database') || n.includes('postgres')) return <Database className="h-5 w-5 text-primary" />;
  if (n.includes('workflow')) return <Activity className="h-5 w-5 text-primary" />;
  if (n.includes('auth'))     return <CheckCircle className="h-5 w-5 text-primary" />;
  if (n.includes('gateway') || n.includes('http')) return <Globe className="h-5 w-5 text-primary" />;
  return <Server className="h-5 w-5 text-primary" />;
}

export default async function ServicesPage() {
  const snapshot = await computeMonitoringSnapshot().catch(() => null);

  const cloudTabs = [
    { id: 'overview',  label: 'Overview',  href: '/cloud',           icon: <Cloud className="h-4 w-4" /> },
    { id: 'tenants',   label: 'Tenants',   href: '/cloud/tenants',   icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', href: '/cloud/analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'services',  label: 'Services',  href: '/cloud/services',  icon: <Settings className="h-4 w-4" /> }
  ];
  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Services', href: '/cloud/services' }
  ];

  const services = snapshot?.data.services ?? [];
  const performance = snapshot?.data.performance;
  const business = snapshot?.data.business;

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={cloudTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg glass border">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  Platform Services
                </h1>
                <p className="text-muted-foreground">
                  Live health of the ATP Cloud subsystems your tenants depend on.
                </p>
              </div>
            </div>
          </div>

          {/* Services list */}
          <Card className="glass border mb-8">
            <CardHeader>
              <CardTitle>Subsystem health</CardTitle>
              <CardDescription>
                Pulled live from the monitoring snapshot. A degraded row means the
                subsystem responded slower than expected or a recent probe failed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Hammer className="h-5 w-5 mx-auto mb-2 opacity-60" />
                  Monitoring snapshot unavailable — try again in a moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          {serviceIcon(svc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {statusIcon(svc.status)}
                            <h3 className="font-semibold truncate">{svc.name}</h3>
                          </div>
                          {svc.detail && (
                            <p className="text-xs text-muted-foreground truncate">{svc.detail}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={STATUS_BADGE[svc.status] ?? STATUS_BADGE.down}>
                        {svc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance + business snapshot — only render when present */}
          {(performance || business) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {performance && (
                <Card className="glass border">
                  <CardHeader>
                    <CardTitle>Performance (last hour)</CardTitle>
                    <CardDescription>From the monitoring snapshot</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <Stat label="Active sessions" value={performance.activeConnections.toLocaleString()} />
                    <Stat label="Avg response" value={`${performance.avgResponseTime} ms`} />
                    <Stat label="Requests / sec" value={performance.requestsPerSecond.toFixed(2)} />
                    <Stat label="Error rate" value={`${(performance.errorRate * 100).toFixed(2)}%`} />
                    <Stat label="Memory" value={`${performance.memoryUsage.toFixed(0)}%`} />
                    <Stat label="CPU" value={`${performance.cpuUsage.toFixed(0)}%`} />
                  </CardContent>
                </Card>
              )}
              {business && (
                <Card className="glass border">
                  <CardHeader>
                    <CardTitle>Platform totals</CardTitle>
                    <CardDescription>Live counts from the database</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <Stat label="Registered agents" value={business.registeredAgents.toLocaleString()} />
                    <Stat label="Active agents" value={business.activeAgents.toLocaleString()} />
                    <Stat label="Credentials issued" value={business.credentialsIssued.toLocaleString()} />
                    <Stat label="Audit events" value={business.auditEvents.toLocaleString()} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
