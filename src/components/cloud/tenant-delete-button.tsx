'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface TenantDeleteButtonProps {
  tenantId: string;
  tenantName: string;
  canDelete: boolean;
}

/**
 * Danger zone card with a two-step delete: click Delete → input the
 * tenant's exact name to confirm → final Delete button. Avoids the
 * "I clicked once and now my tenant is gone" footgun while still
 * being lighter than a separate confirm modal.
 *
 * Server-side enforcement is in deleteTenant(); this is just UX.
 * On success, redirects back to /cloud/tenants. Under the 1:1 model,
 * visiting that page will auto-provision a fresh tenant — so deleting
 * is essentially "wipe my workspace and start over".
 */
export function TenantDeleteButton({ tenantId, tenantName, canDelete }: TenantDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [state, setState] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setState('deleting');
    setError(null);
    try {
      const res = await fetch(`/api/cloud/tenants/${tenantId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Delete failed (${res.status})`);
      }
      router.push('/cloud/tenants');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Danger zone
        </CardTitle>
        <CardDescription>
          {canDelete
            ? 'Deleting a tenant is permanent. Memberships are removed in cascade; agents, workflows, and policies are owned by users (not tenants) so they remain.'
            : 'Only the tenant owner can delete this tenant.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!confirming ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={!canDelete}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete tenant
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              Type <code className="font-mono font-medium px-1 py-0.5 bg-muted rounded">{tenantName}</code> to confirm deletion.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
              placeholder={tenantName}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmText !== tenantName || state === 'deleting'}
                onClick={onDelete}
              >
                {state === 'deleting' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                I understand, delete it
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText('');
                  setError(null);
                  setState('idle');
                }}
                disabled={state === 'deleting'}
              >
                Cancel
              </Button>
            </div>
            {state === 'error' && error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
