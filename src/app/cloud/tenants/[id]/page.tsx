'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

const STATUS_TONE: Record<Tenant['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200'
};

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tenants/${id}`, { credentials: 'include' });
        if (res.status === 404) {
          if (!cancelled) setError('Tenant not found.');
          return;
        }
        if (res.status === 401) {
          if (!cancelled) setError('Sign in to view this tenant.');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTenant(data.tenant);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load tenant');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const patchStatus = async (status: Tenant['status']) => {
    if (!tenant) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setTenant(data.tenant);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update tenant');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!tenant) return;
    if (!confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/cloud/tenants');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete tenant');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/cloud/tenants"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tenants
        </Link>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && error && !tenant && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {tenant && (
          <Card className="glass border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" /> {tenant.name}
                  </CardTitle>
                  <CardDescription>{tenant.domain}</CardDescription>
                </div>
                <Badge variant="outline" className={STATUS_TONE[tenant.status]}>
                  {tenant.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">{tenant.plan}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Trust level</dt>
                  <dd className="font-medium">{tenant.trustLevel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Users</dt>
                  <dd className="font-medium">{tenant.users}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{new Date(tenant.createdAt).toLocaleString()}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Last active</dt>
                  <dd className="font-medium">{new Date(tenant.lastActive).toLocaleString()}</dd>
                </div>
              </dl>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                <div className="flex flex-wrap gap-2">
                  {tenant.status !== 'active' && (
                    <Button size="sm" onClick={() => patchStatus('active')} disabled={busy}>
                      Activate
                    </Button>
                  )}
                  {tenant.status !== 'suspended' && (
                    <Button size="sm" variant="outline" onClick={() => patchStatus('suspended')} disabled={busy}>
                      Suspend
                    </Button>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={remove} disabled={busy} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
