'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';

interface TenantEditFormProps {
  initialName: string;
  canEdit: boolean;
}

export function TenantEditForm({ initialName, canEdit }: TenantEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      setState('error');
      return;
    }
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/cloud/tenants', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      setState('saved');
      // Refresh the server component so the page title + member-count badge
      // reflect the new name without a hard reload.
      router.refresh();
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rename</CardTitle>
        <CardDescription>
          {canEdit
            ? 'Change how this tenant appears in the dashboard.'
            : 'Only owners and admins can rename a tenant.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <Label htmlFor="tenant-name">Tenant name</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit || state === 'saving'}
              placeholder="My workspace"
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={!canEdit || state === 'saving' || name.trim() === initialName.trim()}>
            {state === 'saving' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {state === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </form>
        {state === 'saved' && (
          <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
            <Check className="h-3 w-3" /> Saved
          </p>
        )}
        {state === 'error' && error && (
          <p className="text-xs text-red-600 mt-3 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
