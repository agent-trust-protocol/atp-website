'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Building,
  Shield,
  Activity,
  Filter,
  Download,
  Cloud,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subnav } from '@/components/ui/subnav';
import Link from 'next/link';
import { useMe } from '@/hooks/use-me';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended' | 'archived';
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  archived: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

const PLAN_COLOR: Record<string, string> = {
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  premium: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  free: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

const cloudTabs = [
  { id: 'overview', label: 'Overview', href: '/cloud', icon: <Cloud className="h-4 w-4" /> },
  { id: 'tenants', label: 'Tenants', href: '/cloud/tenants', icon: <Users className="h-4 w-4" /> },
  { id: 'analytics', label: 'Analytics', href: '/cloud/analytics', icon: <Shield className="h-4 w-4" /> },
  { id: 'services', label: 'Services', href: '/cloud/services', icon: <Activity className="h-4 w-4" /> }
];

const breadcrumbs = [
  { label: 'Cloud Dashboard', href: '/cloud' },
  { label: 'Tenants', href: '/cloud/tenants' }
];

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} minutes ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hours ago`;
  return `${Math.floor(ms / 86_400_000)} days ago`;
}

export default function TenantsPage() {
  const me = useMe();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cloud/tenants', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTenants(Array.isArray(data?.tenants) ? data.tenants : []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load tenants');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me.authenticated, me.isFounder]);

  const filteredTenants = useMemo(
    () =>
      tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [tenants, searchTerm]
  );

  const totalMembers = tenants.reduce((sum, t) => sum + t.memberCount, 0);
  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const enterpriseCount = tenants.filter((t) => t.plan.toLowerCase() === 'enterprise').length;

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={cloudTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg glass border">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">Tenant Management</h1>
                <p className="text-muted-foreground">
                  Manage ATP Cloud tenants and their configurations
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm min-w-64"
                  />
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <Button asChild>
                <Link href="/cloud/tenants/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tenant
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Tenants" value={tenants.length} icon={<Building className="h-5 w-5 text-primary" />} />
            <StatCard label="Active" value={activeCount} icon={<Activity className="h-5 w-5 text-green-600" />} />
            <StatCard label="Total Members" value={totalMembers} icon={<Users className="h-5 w-5 text-blue-600" />} />
            <StatCard label="Enterprise" value={enterpriseCount} icon={<Shield className="h-5 w-5 text-purple-600" />} />
          </div>

          {/* Tenants List */}
          <Card className="glass border">
            <CardHeader>
              <CardTitle>Tenants ({filteredTenants.length})</CardTitle>
              <CardDescription>
                {me.isFounder
                  ? 'Founder view — every tenant in the system.'
                  : 'Tenants you belong to.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tenants…
                </div>
              ) : error ? (
                <div className="py-12 text-center text-sm text-red-600">{error}</div>
              ) : tenants.length === 0 ? (
                <EmptyState authenticated={me.authenticated || me.isFounder} />
              ) : (
                <div className="space-y-4">
                  {filteredTenants.map((tenant) => (
                    <TenantRow key={tenant.id} tenant={tenant} />
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

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="glass border hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function TenantRow({ tenant }: { tenant: Tenant }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold">{tenant.name}</h3>
            <Badge variant="outline" className={STATUS_COLOR[tenant.status] ?? STATUS_COLOR.archived}>
              {tenant.status}
            </Badge>
            <Badge variant="outline" className={PLAN_COLOR[tenant.plan.toLowerCase()] ?? PLAN_COLOR.free}>
              {tenant.plan}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1 font-mono text-xs">{tenant.slug}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{tenant.memberCount} member{tenant.memberCount === 1 ? '' : 's'}</span>
            <span>Role: {tenant.role}</span>
            <span>Created: {formatRelative(tenant.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cloud/tenants/${tenant.id}`}>View Details</Link>
        </Button>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ authenticated }: { authenticated: boolean }) {
  if (!authenticated) {
    return (
      <div className="py-12 text-center space-y-3">
        <Building className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sign in to see your tenants.</p>
        <Button asChild size="sm">
          <Link href="/login?returnTo=/cloud/tenants">Sign in</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="py-12 text-center space-y-3">
      <Building className="h-12 w-12 mx-auto text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No tenants yet. Reload to auto-provision your first tenant, or create one.
      </p>
      <Button asChild size="sm">
        <Link href="/cloud/tenants/new">
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </Link>
      </Button>
    </div>
  );
}
