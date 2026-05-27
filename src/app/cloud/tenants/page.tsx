'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Building,
  Shield,
  Activity,
  ArrowLeft,
  Filter,
  Download,
  Cloud
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subnav } from '@/components/ui/subnav';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'Basic' | 'Professional' | 'Enterprise';
  trustLevel: 'Basic' | 'Verified' | 'Premium' | 'Enterprise';
  users: number;
  createdAt: string;
  lastActive: string;
}

export default function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tenants', { credentials: 'include' });
        if (res.status === 401) {
          if (!cancelled) setError('Sign in to view your tenants.');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTenants(Array.isArray(data.tenants) ? data.tenants : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load tenants');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'suspended': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch(level) {
      case 'Enterprise': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'Premium': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'Verified': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'Basic': return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cloudTabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/cloud',
      icon: <Cloud className="h-4 w-4" />
    },
    {
      id: 'tenants',
      label: 'Tenants',
      href: '/cloud/tenants',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/cloud/analytics',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'services',
      label: 'Services',
      href: '/cloud/services',
      icon: <Activity className="h-4 w-4" />
    }
  ];

  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Tenants', href: '/cloud/tenants' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Subnav
        tabs={cloudTabs}
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg glass border">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  Tenant Management
                </h1>
                <p className="text-muted-foreground">
                  Manage ATP Cloud tenants and their configurations
                </p>
              </div>
            </div>

            {/* Controls */}
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
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
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
            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                    <p className="text-2xl font-bold">{tenants.length}</p>
                  </div>
                  <Building className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</p>
                  </div>
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.users, 0)}</p>
                  </div>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enterprise</p>
                    <p className="text-2xl font-bold">{tenants.filter(t => t.trustLevel === 'Enterprise').length}</p>
                  </div>
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenants List */}
          <Card className="glass border">
            <CardHeader>
              <CardTitle>Tenants ({filteredTenants.length})</CardTitle>
              <CardDescription>
                Manage and monitor all ATP Cloud tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-sm text-muted-foreground py-6">Loading tenants…</p>
              )}
              {!loading && error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              {!loading && !error && filteredTenants.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No tenants yet.{' '}
                  <Link href="/cloud/tenants/new" className="text-primary underline">Create your first one</Link>.
                </div>
              )}
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{tenant.name}</h3>
                          <Badge variant="outline" className={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                          <Badge variant="outline" className={getTrustLevelColor(tenant.trustLevel)}>
                            {tenant.trustLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{tenant.domain}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{tenant.users} users</span>
                          <span>Plan: {tenant.plan}</span>
                          <span>Last active: {new Date(tenant.lastActive).toLocaleString()}</span>
                          <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cloud/tenants/${tenant.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
