'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface Member {
  userId: string;
  email: string | null;
  name: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  admin: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  member: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

interface TenantMembersPanelProps {
  tenantId: string;
  /** Whether the current viewer can remove members (owner or founder). */
  canManage: boolean;
}

export function TenantMembersPanel({ tenantId, canManage }: TenantMembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/members`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setMembers(data.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const remove = async (userId: string, label: string) => {
    if (!confirm(`Remove ${label} from this tenant?`)) return;
    setRemovingId(userId);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error ?? `Remove failed (${r.status})`);
      }
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
        <CardDescription>
          {canManage
            ? 'Owners can remove members. Invitation flow is on the roadmap; until then, add members via psql.'
            : 'Only the tenant owner can manage members.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No members yet.</p>
        ) : (
          members.map((m) => {
            const label = m.name || m.email || m.userId;
            const isOwner = m.role === 'owner';
            return (
              <div
                key={m.userId}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.name ?? m.email ?? '(unknown user)'}</span>
                    <Badge variant="outline" className={ROLE_BADGE[m.role]}>{m.role}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {m.email ?? ''}{m.email && m.userId ? ' · ' : ''}
                    <code className="font-mono">{m.userId.slice(0, 8)}…</code>
                    <span className="ml-2">joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {canManage && !isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(m.userId, label)}
                    disabled={removingId === m.userId}
                    aria-label={`Remove ${label}`}
                  >
                    {removingId === m.userId
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4 text-red-600" />
                    }
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
