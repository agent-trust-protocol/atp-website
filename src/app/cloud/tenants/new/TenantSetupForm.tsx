'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building, Sparkles, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  tenantId: string;
  initialName: string;
  initialSlug: string;
  isInitialSetup: boolean;
}

export default function TenantSetupForm({ tenantId, initialName, initialSlug, isInitialSetup }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== initialName || slug.trim().toLowerCase() !== initialSlug;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/cloud/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      router.push(`/cloud/tenants/${tenantId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tenant');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href={isInitialSetup ? '/cloud' : '/cloud/tenants'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isInitialSetup ? 'Back to dashboard' : 'Back to tenants'}
          </Link>

          {/* Honest banner — initial setup vs editing existing */}
          {isInitialSetup ? (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Welcome — let's name your tenant.</p>
                <p className="text-muted-foreground mt-1">
                  We auto-provisioned a tenant for you so the platform works on first run.
                  Set a real name and subdomain below to make it yours.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-sm flex items-start gap-3">
              <Pencil className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">You're updating your existing tenant.</p>
                <p className="text-muted-foreground mt-1">
                  Multi-tenant support is coming soon. For now, this form edits your one tenant.
                </p>
              </div>
            </div>
          )}

          <Card className="glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Tenant settings
              </CardTitle>
              <CardDescription>
                Name your workspace and pick a subdomain. You can change either later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Acme Corp"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown to your team and on the tenant detail page.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      required
                      minLength={2}
                      maxLength={40}
                      pattern="^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$"
                      placeholder="acme"
                      disabled={submitting}
                      className="font-mono"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.atp.cloud</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and dashes only.
                  </p>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" asChild>
                    <Link href={isInitialSetup ? '/cloud' : `/cloud/tenants/${tenantId}`}>
                      Cancel
                    </Link>
                  </Button>
                  <Button type="submit" disabled={submitting || !name.trim() || !slug.trim() || !dirty}>
                    {submitting
                      ? 'Saving…'
                      : isInitialSetup
                        ? 'Create tenant'
                        : 'Save changes'}
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
