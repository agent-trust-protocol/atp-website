'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, X, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';

interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  accepted: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  revoked: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  expired: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

interface TenantInvitationsPanelProps {
  tenantId: string;
  canManage: boolean;
  origin: string;
}

/**
 * Renders pending + historical tenant invitations. Owner/admin/founder
 * can revoke pending ones. The "Invite" button on TenantMembersPanel
 * creates new invitations; this panel surfaces them after the modal
 * closes and lets you copy the URL or take it back.
 */
export function TenantInvitationsPanel({ tenantId, canManage, origin }: TenantInvitationsPanelProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/invitations`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setInvitations(data.invitations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // refresh every 30s so newly-issued invites (from the sibling Invite
    // form) appear without a hard reload
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const revoke = async (invitationId: string, email: string) => {
    if (!confirm(`Revoke the invitation for ${email}?`)) return;
    setRevokingId(invitationId);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${r.status}`);
      }
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setRevokingId(null);
    }
  };

  const copyUrl = async (invitation: Invitation) => {
    const url = `${origin.replace(/\/$/, '')}/invitations/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard denied; ignore
    }
  };

  const pending = invitations.filter((i) => i.status === 'pending');
  const history = invitations.filter((i) => i.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitations
        </CardTitle>
        <CardDescription>
          Pending invitations and recent history. {canManage ? 'Owner/admin can revoke pending ones.' : 'View-only.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        ) : (
          <>
            {pending.length === 0 && history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No invitations yet. Use the Invite button on the Members panel above.
              </p>
            )}

            {pending.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending ({pending.length})
                </div>
                {pending.map((inv) => (
                  <div key={inv.id} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-medium truncate">{inv.email}</span>
                        <Badge variant="outline">{inv.role}</Badge>
                        <Badge variant="outline" className={STATUS_COLOR[inv.status]}>
                          {inv.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(inv)}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedId === inv.id ? (
                          <><Check className="h-3 w-3 mr-1" />Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" />Copy link</>
                        )}
                      </Button>
                      {canManage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => revoke(inv.id, inv.email)}
                          disabled={revokingId === inv.id}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                        >
                          {revokingId === inv.id
                            ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            : <X className="h-3 w-3 mr-1" />
                          }
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <details className="pt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  History ({history.length})
                </summary>
                <div className="space-y-2 mt-2">
                  {history.map((inv) => (
                    <div key={inv.id} className="border rounded-lg p-2 bg-muted/30 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="truncate">{inv.email}</span>
                          <Badge variant="outline" className="text-[10px] py-0">{inv.role}</Badge>
                          <Badge variant="outline" className={`text-[10px] py-0 ${STATUS_COLOR[inv.status]}`}>
                            {inv.status}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {inv.acceptedAt
                            ? `accepted ${new Date(inv.acceptedAt).toLocaleDateString()}`
                            : new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
