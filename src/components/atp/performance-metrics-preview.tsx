'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  Network,
  Database,
  CheckCircle,
  AlertTriangle,
  Users,
  Lock,
  ArrowRight,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useMe } from '@/hooks/use-me';

type MetricsShape = {
  activeConnections: MetricData
  signaturesGenerated: MetricData
  responseTime: MetricData
  uptime: MetricData
  errorRate: MetricData
  throughput: MetricData
}

// Maps the monitoring proxy's response (see
// src/app/api/monitoring/metrics/route.ts → upstream ATP_MONITORING_URL) onto
// the component's display shape. Returns null when the proxy didn't include
// usable telemetry (env unset, upstream down, or anonymous demo response).
function mapLiveMetrics(json: unknown, previous: MetricsShape): MetricsShape | null {
  const perf = (json as { data?: { performance?: Record<string, number> } } | null)?.data?.performance;
  if (!perf || typeof perf !== 'object') return null;
  const delta = (next: number, prev: number) => Math.round((next - prev) * 100) / 100;
  const trend = (d: number): MetricData['trend'] => (d > 0 ? 'up' : d < 0 ? 'down' : 'stable');
  const live = (key: keyof MetricsShape, raw: number, unit: string): MetricData => {
    const prev = previous[key].value;
    const change = delta(raw, prev);
    return { value: raw, change, trend: trend(change), unit };
  };
  return {
    activeConnections: live('activeConnections', perf.activeConnections ?? 0, ''),
    signaturesGenerated: live('signaturesGenerated', perf.signaturesGenerated ?? 0, '/hour'),
    responseTime: live('responseTime', perf.avgResponseTime ?? 0, 'ms'),
    uptime: live('uptime', Math.max(0, 100 - (perf.errorRate ?? 0)), '%'),
    errorRate: live('errorRate', perf.errorRate ?? 0, '%'),
    throughput: live('throughput', (perf.requestsPerSecond ?? 0) * 60, 'req/min')
  };
}

interface MetricData {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

interface SystemStatus {
  component: string
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  lastCheck: string
}

export function PerformanceMetricsPreview() {
  const router = useRouter();
  const me = useMe();
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  // When the monitoring proxy returns real data, this holds it and takes
  // priority over the sample numbers below. `null` = no live data yet (env
  // unset, upstream down, or user not authorized), so we render sample.
  const [liveMetrics, setLiveMetrics] = useState<MetricsShape | null>(null);

  // Sample metrics — illustrative only, used when liveMetrics is null.
  const [metrics, setMetrics] = useState<MetricsShape>({
    activeConnections: { value: 1247, change: 12, trend: 'up' as const, unit: '' },
    signaturesGenerated: { value: 23567, change: 234, trend: 'up' as const, unit: '/hour' },
    responseTime: { value: 23, change: -2, trend: 'down' as const, unit: 'ms' },
    uptime: { value: 99.97, change: 0.02, trend: 'up' as const, unit: '%' },
    errorRate: { value: 0.03, change: -0.01, trend: 'down' as const, unit: '%' },
    throughput: { value: 4327, change: 156, trend: 'up' as const, unit: 'req/min' }
  });

  const [systemStatus] = useState<SystemStatus[]>([
    {
      component: 'Quantum-Safe Engine',
      status: 'healthy',
      uptime: 99.98,
      lastCheck: '30 seconds ago'
    },
    {
      component: 'Trust Evaluation Service',
      status: 'healthy',
      uptime: 99.95,
      lastCheck: '45 seconds ago'
    },
    {
      component: 'Policy Engine',
      status: 'warning',
      uptime: 98.12,
      lastCheck: '1 minute ago'
    },
    {
      component: 'Audit Logger',
      status: 'healthy',
      uptime: 100.0,
      lastCheck: '15 seconds ago'
    }
  ]);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeConnections: {
          ...prev.activeConnections,
          value: prev.activeConnections.value + Math.floor(Math.random() * 10 - 3),
          change: Math.floor(Math.random() * 20 - 10)
        },
        signaturesGenerated: {
          ...prev.signaturesGenerated,
          value: prev.signaturesGenerated.value + Math.floor(Math.random() * 50),
          change: Math.floor(Math.random() * 100)
        },
        responseTime: {
          ...prev.responseTime,
          value: Math.max(15, prev.responseTime.value + Math.floor(Math.random() * 6 - 3)),
          change: Math.floor(Math.random() * 10 - 5)
        },
        throughput: {
          ...prev.throughput,
          value: prev.throughput.value + Math.floor(Math.random() * 200 - 100),
          change: Math.floor(Math.random() * 300 - 150)
        }
      }));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Live telemetry: poll the monitoring proxy when the viewer is authenticated
  // (the upstream endpoint is auth-gated; founder is treated as authenticated
  // by /api/me). One initial fetch + 5s polling while "Live" is engaged.
  useEffect(() => {
    if (!me.authenticated && !me.isFounder) {
      setLiveMetrics(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch('/api/monitoring/metrics', { cache: 'no-store', credentials: 'include' });
        if (!r.ok || cancelled) return;
        const json = await r.json().catch(() => null);
        setLiveMetrics((prev) => mapLiveMetrics(json, prev ?? metrics) ?? prev);
        if (!cancelled) setLastUpdate(new Date());
      } catch {
        // Network/parse error — keep whatever we had, fall through to sample.
      }
    };
    tick();
    if (!isLive) return () => { cancelled = true; };
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLive, me.authenticated, me.isFounder, metrics]);

  const displayMetrics = liveMetrics ?? metrics;
  const dataSource: 'live' | 'sample' = liveMetrics ? 'live' : 'sample';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const MetricCard = ({ title, icon: Icon, metric, description }: {
    title: string
    icon: any
    metric: MetricData
    description: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">
                {metric.value.toLocaleString()}
                {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-blue-500" />
        </div>
        <div className="flex items-center gap-1 mt-3">
          {metric.trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : metric.trend === 'down' ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : (
            <TrendingUp className="h-3 w-3 text-gray-500" />
          )}
          <span className={`text-xs ${
            metric.change > 0 ? 'text-green-500' : metric.change < 0 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {metric.change > 0 ? '+' : ''}{metric.change} from last hour
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BarChart3 className="h-8 w-8 text-green-500" />
          <h2 className="text-3xl font-bold">Performance Metrics Preview</h2>
        </div>
        <div className="flex justify-center">
          {dataSource === 'live' ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/40">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live telemetry
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/40">
              Sample data — not live telemetry
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {dataSource === 'live'
            ? 'Live system performance, connection, and health metrics from the connected ATP monitoring service.'
            : 'Illustrative numbers showing the kinds of system performance, connection, and health metrics ATP surfaces. Live telemetry from a connected ATP deployment will replace these once the monitoring backend is wired up.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Activity size={14} className="mr-1" />
            Real-time Monitoring
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Zap size={14} className="mr-1" />
            High Performance
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Shield size={14} className="mr-1" />
            Enterprise Grade
          </Badge>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={isLive ? 'default' : 'outline'}
          onClick={() => setIsLive(!isLive)}
          className="gap-2"
        >
          {isLive ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Live Demo
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Start Live Demo
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Active Connections"
              icon={Network}
              metric={displayMetrics.activeConnections}
              description="Concurrent agent connections"
            />
            <MetricCard
              title="Signatures Generated"
              icon={Shield}
              metric={displayMetrics.signaturesGenerated}
              description="Quantum-safe signatures per hour"
            />
            <MetricCard
              title="Response Time"
              icon={Clock}
              metric={displayMetrics.responseTime}
              description="Average API response time"
            />
            <MetricCard
              title="System Uptime"
              icon={Activity}
              metric={displayMetrics.uptime}
              description="Overall system availability"
            />
            <MetricCard
              title="Error Rate"
              icon={AlertTriangle}
              metric={displayMetrics.errorRate}
              description="Failed operations percentage"
            />
            <MetricCard
              title="Throughput"
              icon={Zap}
              metric={displayMetrics.throughput}
              description="Requests processed per minute"
            />
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>24-hour performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">2.3M</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">567K</div>
                  <div className="text-sm text-muted-foreground">Signatures Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">1,847</div>
                  <div className="text-sm text-muted-foreground">Policies Evaluated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">23</div>
                  <div className="text-sm text-muted-foreground">Security Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cryptographic Performance</CardTitle>
                <CardDescription>Quantum-safe signature operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ed25519 Signatures</span>
                    <span className="text-sm font-medium">2,847/sec</span>
                  </div>
                  <Progress value={95} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dilithium Signatures</span>
                    <span className="text-sm font-medium">1,234/sec</span>
                  </div>
                  <Progress value={87} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hybrid Verification</span>
                    <span className="text-sm font-medium">3,456/sec</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Performance</CardTitle>
                <CardDescription>Connection and latency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">23ms</div>
                    <div className="text-xs text-muted-foreground">Avg Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">99.97%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">4.3K</div>
                    <div className="text-xs text-muted-foreground">Requests/min</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-500">1,247</div>
                    <div className="text-xs text-muted-foreground">Active Connections</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>Recent security-related activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Policy evaluation passed</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">High trust level required</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5 min ago</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Quantum signature verified</span>
                  </div>
                  <span className="text-xs text-muted-foreground">7 min ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trust Metrics</CardTitle>
                <CardDescription>Agent trust level distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Trust (90-100%)</span>
                    <span className="text-sm font-medium">45 agents</span>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium Trust (70-89%)</span>
                    <span className="text-sm font-medium">28 agents</span>
                  </div>
                  <Progress value={60} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Trust (50-69%)</span>
                    <span className="text-sm font-medium">12 agents</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
              <CardDescription>Health status of all ATP services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(component.status)}
                    <div>
                      <div className="font-medium">{component.component}</div>
                      <div className="text-sm text-muted-foreground">
                        Uptime: {component.uptime}% • Last check: {component.lastCheck}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enterprise Upgrade CTA */}
      <Card>
        <CardContent className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-lg">Full Production Monitoring</h3>
                  <p className="text-muted-foreground">
                    Get complete system monitoring, custom dashboards, alerts, and historical analytics
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push('/enterprise')}>
                Upgrade to Enterprise
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
