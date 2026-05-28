'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'revoked' | 'expired';
  rateLimit: { requestsPerMinute: number; requestsPerDay: number };
  metadata?: { description: string | null; ipWhitelist: string[] | null };
}

const ENV_COLOR: Record<string, string> = {
  development: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  staging: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  production: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
};

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  revoked: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  expired: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEnv, setNewEnv] = useState<'development' | 'staging' | 'production'>('development');
  const [newPermissions, setNewPermissions] = useState<string[]>(['read:agents', 'read:credentials']);
  const [newExpiresIn, setNewExpiresIn] = useState<number | ''>('');

  // Reveal-once banner — raw key is only shown right after creation.
  const [revealedKey, setRevealedKey] = useState<{ name: string; key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/sdk/keys', { credentials: 'include', cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setKeys(data.data?.keys ?? []);
      setAvailablePermissions(data.data?.availablePermissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const togglePermission = (perm: string) => {
    setNewPermissions((curr) =>
      curr.includes(perm) ? curr.filter((p) => p !== perm) : [...curr, perm]
    );
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const r = await fetch('/api/sdk/keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          environment: newEnv,
          permissions: newPermissions,
          expiresIn: typeof newExpiresIn === 'number' && newExpiresIn > 0 ? newExpiresIn : undefined
        })
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data?.error ?? `HTTP ${r.status}`);
      setRevealedKey({ name: data.data.name, key: data.data.key });
      setShowForm(false);
      setNewName('');
      setNewExpiresIn('');
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const copyRevealedKey = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1500);
    } catch {
      // clipboard denied; ignore
    }
  };

  const revoke = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"? Clients using it will start receiving 401.`)) return;
    setRevokingId(id);
    setError(null);
    try {
      const r = await fetch(`/api/sdk/keys?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Key className="h-7 w-7 text-primary" />
                API keys
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Create, scope, and revoke keys for SDK access. Keys are
                hashed at rest — the raw value is only shown once at
                creation.
              </p>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New key
              </Button>
            )}
          </div>

          {revealedKey && (
            <Card className="border-green-300 bg-green-50/30 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Eye className="h-5 w-5" />
                  Save this key now
                </CardTitle>
                <CardDescription>
                  This is the only time we'll show <strong>{revealedKey.name}</strong>'s full
                  value. After you close this card it can't be recovered — generate a new key
                  if you lose it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-background border rounded-md">
                  <code className="font-mono text-xs flex-1 break-all">{revealedKey.key}</code>
                  <Button type="button" size="sm" variant="outline" onClick={copyRevealedKey}>
                    {copiedKey ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setRevealedKey(null)}
                >
                  I've saved it — close
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200">
              <CardContent className="py-3 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {error}
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create a new key</CardTitle>
                <CardDescription>
                  The raw value is hashed before storage. You'll only see it once on this page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createKey} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="key-name">Name</Label>
                      <Input
                        id="key-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="My CLI"
                        disabled={creating}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="key-env">Environment</Label>
                      <select
                        id="key-env"
                        value={newEnv}
                        onChange={(e) => setNewEnv(e.target.value as typeof newEnv)}
                        disabled={creating}
                        className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="development">development</option>
                        <option value="staging">staging</option>
                        <option value="production">production</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePermissions.map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            disabled={creating}
                          />
                          <code className="font-mono">{perm}</code>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="key-expires">Expires in (days, optional)</Label>
                    <Input
                      id="key-expires"
                      type="number"
                      min={1}
                      value={newExpiresIn}
                      onChange={(e) =>
                        setNewExpiresIn(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="never expires"
                      disabled={creating}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
                      {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Create key
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your keys ({keys.length})</CardTitle>
              <CardDescription>
                Active keys can be used immediately. Revoked / expired keys
                are kept here for audit but cannot be reactivated — issue a
                new one instead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No keys yet. Click <strong>New key</strong> above to create your first.
                </p>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div key={k.id} className="border rounded-lg p-3 bg-card">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-medium">{k.name}</span>
                          <Badge variant="outline" className={ENV_COLOR[k.environment]}>
                            {k.environment}
                          </Badge>
                          <Badge variant="outline" className={STATUS_COLOR[k.status]}>
                            {k.status}
                          </Badge>
                          <code className="font-mono text-xs text-muted-foreground">
                            {k.keyPrefix}…
                          </code>
                        </div>
                        {k.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revoke(k.id, k.name)}
                            disabled={revokingId === k.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {revokingId === k.id
                              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              : <Trash2 className="h-3 w-3 mr-1" />
                            }
                            Revoke
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                        {k.lastUsedAt && <span>Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                        {k.expiresAt && <span>Expires {new Date(k.expiresAt).toLocaleDateString()}</span>}
                        <span>{k.rateLimit.requestsPerMinute}/min · {k.rateLimit.requestsPerDay}/day</span>
                      </div>
                      {k.permissions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {k.permissions.map((p) => (
                            <code key={p} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/60">
                              {p}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
