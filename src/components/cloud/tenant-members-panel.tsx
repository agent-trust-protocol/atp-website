'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Loader2, Trash2, AlertTriangle, UserPlus, Copy, Check, Mail } from 'lucide-react';

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
  /** Whether the current viewer can manage members (owner or founder). */
  canManage: boolean;
  /** The viewer's own user id, so we can hide self-targeted controls. */
  viewerUserId: string | null;
  /** Whether the viewer is the tenant owner (true owner only — not founder).
   *  Controls visibility of the "Transfer ownership" affordance. */
  isOwner: boolean;
}

export function TenantMembersPanel({
  tenantId,
  canManage,
  viewerUserId,
  isOwner
}: TenantMembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

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

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/invitations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setInviteEmail('');
      setLastInviteUrl(data.inviteUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1500);
    } catch {
      // clipboard denied; ignore silently
    }
  };

  const changeRole = async (userId: string, role: 'admin' | 'member') => {
    setChangingRoleId(userId);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/members/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${r.status}`);
      }
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role change failed');
    } finally {
      setChangingRoleId(null);
    }
  };

  const transferOwnershipTo = async (newOwnerUserId: string, label: string) => {
    if (!confirm(`Transfer ownership to ${label}? You'll be demoted to admin.`)) return;
    setTransferring(true);
    setTransferTargetId(newOwnerUserId);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/tenants/${tenantId}/transfer-ownership`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerUserId })
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${r.status}`);
      }
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ownership transfer failed');
    } finally {
      setTransferring(false);
      setTransferTargetId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
          <CardDescription className="mt-1.5">
            {canManage
              ? 'Invite new members by email; remove members anytime. Owners cannot be removed via this panel.'
              : 'Only the tenant owner can manage members.'}
          </CardDescription>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setShowInvite((s) => !s); setLastInviteUrl(null); }}>
            <UserPlus className="h-4 w-4 mr-1" />
            {showInvite ? 'Cancel' : 'Invite'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {canManage && showInvite && (
          <form onSubmit={invite} className="p-3 border rounded-lg bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="invite-email" className="text-xs">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    disabled={inviting}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="invite-role" className="text-xs">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  disabled={inviting}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
              {inviting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Send invitation
            </Button>
            {lastInviteUrl && (
              <div className="border rounded-md p-2 bg-green-50/40 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-xs">
                <div className="flex items-center gap-1 text-green-700 dark:text-green-400 mb-1">
                  <Check className="h-3 w-3" /> Invitation sent (and emailed if email is configured).
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono break-all flex-1">{lastInviteUrl}</code>
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={copyInviteUrl}>
                    {copiedInvite ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
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
            const isThisOwner = m.role === 'owner';
            const isSelf = m.userId === viewerUserId;
            return (
              <div
                key={m.userId}
                className="flex items-center justify-between p-3 border rounded-lg bg-card gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.name ?? m.email ?? '(unknown user)'}</span>
                    {/* Show the role select when the viewer can manage AND this row is
                        a non-owner non-self; otherwise just render the badge. */}
                    {canManage && !isThisOwner && !isSelf ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.userId, e.target.value as 'admin' | 'member')}
                        disabled={changingRoleId === m.userId}
                        className="bg-background border border-border rounded-md px-2 py-0.5 text-xs"
                        aria-label={`Change role for ${label}`}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className={ROLE_BADGE[m.role]}>{m.role}</Badge>
                    )}
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {m.email ?? ''}{m.email && m.userId ? ' · ' : ''}
                    <code className="font-mono">{m.userId.slice(0, 8)}…</code>
                    <span className="ml-2">joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Owner can transfer ownership TO any non-owner non-self member. */}
                  {isOwner && !isThisOwner && !isSelf && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => transferOwnershipTo(m.userId, label)}
                      disabled={transferring && transferTargetId === m.userId}
                      title={`Transfer ownership to ${label}`}
                      className="text-xs"
                    >
                      {transferring && transferTargetId === m.userId
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : 'Make owner'
                      }
                    </Button>
                  )}
                  {canManage && !isThisOwner && (
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
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
