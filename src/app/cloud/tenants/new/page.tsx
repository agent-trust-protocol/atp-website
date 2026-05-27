'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PLANS = ['Basic', 'Professional', 'Enterprise'] as const;
const TRUST_LEVELS = ['Basic', 'Verified', 'Premium', 'Enterprise'] as const;

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [plan, setPlan] = useState<typeof PLANS[number]>('Basic');
  const [trustLevel, setTrustLevel] = useState<typeof TRUST_LEVELS[number]>('Basic');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          domain: domain.trim() || undefined,
          plan,
          trustLevel
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      router.push('/cloud/tenants');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/cloud/tenants"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to tenants
          </Link>

          <Card className="glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Create tenant
              </CardTitle>
              <CardDescription>
                Provision a new ATP Cloud workspace. You can change the plan and trust
                level later from the tenant detail page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Subdomain (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="acme"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.atp.cloud</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Defaults to a slug of the name if left blank.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <select
                      id="plan"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as typeof PLANS[number])}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trust">Trust level</Label>
                    <select
                      id="trust"
                      value={trustLevel}
                      onChange={(e) => setTrustLevel(e.target.value as typeof TRUST_LEVELS[number])}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {TRUST_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/cloud/tenants">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={submitting || !name.trim()}>
                    {submitting ? 'Creating…' : 'Create tenant'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
