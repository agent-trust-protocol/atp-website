'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMe } from '@/hooks/use-me';

interface PublicInvitation {
  id: string;
  tenantId: string;
  tenantName: string | null;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export default function InvitationAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const me = useMe();
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${params.token}/accept`, { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        setInvitation(data.invitation);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load invitation'))
      .finally(() => setLoading(false));
  }, [params.token]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const r = await fetch(`/api/invitations/${params.token}/accept`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setAccepted(true);
      // Brief pause for the success message, then redirect to the tenant.
      setTimeout(() => router.push(`/cloud/tenants/${data.tenantId}`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Tenant invitation</CardTitle>
          <CardDescription>
            Accept to join an Agent Trust Protocol tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}

          {error && !accepted && (
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50/40 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {invitation && !accepted && (
            <>
              <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                <Row icon={<Building className="h-4 w-4" />} label="Tenant" value={invitation.tenantName ?? '(unnamed)'} />
                <Row icon={<Mail className="h-4 w-4" />} label="Invited address" value={invitation.email} />
                <Row icon={<Shield className="h-4 w-4" />} label="Role" value={<Badge variant="outline">{invitation.role}</Badge>} />
                <Row icon={<Loader2 className="h-4 w-4" />} label="Expires" value={new Date(invitation.expiresAt).toLocaleString()} />
              </div>

              {invitation.status !== 'pending' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  This invitation is <strong>{invitation.status}</strong> and can no longer be used.
                </p>
              )}

              {invitation.status === 'pending' && (
                <>
                  {me.loading ? (
                    <p className="text-xs text-muted-foreground text-center">Checking session…</p>
                  ) : !me.authenticated ? (
                    <Button asChild className="w-full">
                      <Link href={`/login?returnTo=/invitations/${params.token}`}>
                        Sign in to accept
                      </Link>
                    </Button>
                  ) : me.user?.email?.toLowerCase().trim() !== invitation.email.toLowerCase().trim() ? (
                    <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
                      You're signed in as <strong>{me.user?.email}</strong>, but this invitation
                      was sent to <strong>{invitation.email}</strong>. Sign out and back in with
                      the right account to accept.
                    </div>
                  ) : (
                    <Button onClick={accept} disabled={accepting} className="w-full">
                      {accepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Accept invitation
                    </Button>
                  )}
                </>
              )}
            </>
          )}

          {accepted && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50/40 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              Joined! Taking you to the tenant…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
