'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Webhook, Hand, Loader2, Copy, Check, Zap } from 'lucide-react';

interface Trigger {
  id: string;
  workflowId: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  name: string;
  configuration: Record<string, unknown>;
  isEnabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
  createdAt: string;
}

const TYPE_ICON = {
  manual: <Hand className="h-4 w-4" />,
  schedule: <Calendar className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  event: <Zap className="h-4 w-4" />
};

export function WorkflowTriggersPanel({ workflowId, origin }: { workflowId: string; origin: string }) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add-trigger form state
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<'schedule' | 'webhook' | 'event'>('schedule');
  const [newName, setNewName] = useState('');
  const [newInterval, setNewInterval] = useState(300);
  const [newEventName, setNewEventName] = useState('policy.violation');
  const [newEventPolicyId, setNewEventPolicyId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/workflows/${workflowId}/triggers`, { credentials: 'include', cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setTriggers(data.triggers ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load triggers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const addTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // Per-type configuration: schedule needs intervalSeconds, event needs
      // an event name (+ optional policy filter), webhook is configurationless.
      const configuration =
        newType === 'schedule' ? { intervalSeconds: newInterval }
        : newType === 'event' ? {
            event: newEventName.trim() || 'policy.violation',
            ...(newEventPolicyId.trim() ? { policyId: newEventPolicyId.trim() } : {})
          }
        : {};
      const r = await fetch(`/api/workflows/${workflowId}/triggers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          name: newName.trim(),
          configuration
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setShowForm(false);
      setNewName('');
      setNewInterval(300);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add trigger');
    } finally {
      setBusy(false);
    }
  };

  const removeTrigger = async (triggerId: string) => {
    if (!confirm('Delete this trigger?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/workflow-triggers/${triggerId}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard may be denied; ignore silently
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Triggers</CardTitle>
          <CardDescription>How this workflow gets invoked.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Cancel' : 'Add trigger'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={addTrigger} className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trigger-type">Type</Label>
                <select
                  id="trigger-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'schedule' | 'webhook' | 'event')}
                  className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  disabled={busy}
                >
                  <option value="schedule">Schedule</option>
                  <option value="webhook">Webhook</option>
                  <option value="event">Event (e.g. policy.violation)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="trigger-name">Name</Label>
                <Input
                  id="trigger-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Every 5 minutes"
                  disabled={busy}
                  className="mt-1"
                />
              </div>
            </div>
            {newType === 'schedule' && (
              <div>
                <Label htmlFor="trigger-interval">Interval (seconds, &ge; 60)</Label>
                <Input
                  id="trigger-interval"
                  type="number"
                  min={60}
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value))}
                  disabled={busy}
                  className="mt-1"
                />
              </div>
            )}
            {newType === 'event' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="trigger-event-name">Event name</Label>
                  <Input
                    id="trigger-event-name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="policy.violation"
                    disabled={busy}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="trigger-event-policy">Policy ID (optional filter)</Label>
                  <Input
                    id="trigger-event-policy"
                    value={newEventPolicyId}
                    onChange={(e) => setNewEventPolicyId(e.target.value)}
                    placeholder="leave blank to match any policy"
                    disabled={busy}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <Button type="submit" size="sm" disabled={busy || !newName.trim()}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save trigger
            </Button>
          </form>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading triggers…
          </div>
        ) : triggers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No triggers yet — the workflow runs only on manual Run clicks.</p>
        ) : (
          <div className="space-y-2">
            {triggers.map((t) => {
              const webhookUrl = t.type === 'webhook' ? `${origin}/api/webhooks/${t.id}` : null;
              return (
                <div key={t.id} className="flex items-start justify-between p-3 border rounded-lg bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="gap-1">
                        {TYPE_ICON[t.type]}
                        {t.type}
                      </Badge>
                      <span className="font-medium">{t.name}</span>
                      {!t.isEnabled && <Badge variant="outline">disabled</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {t.type === 'schedule' && (
                        <div>Every {(t.configuration as { intervalSeconds?: number }).intervalSeconds ?? 60} seconds</div>
                      )}
                      {t.type === 'event' && (
                        <div>
                          Event <code className="font-mono">{(t.configuration as { event?: string }).event ?? '(unset)'}</code>
                          {(t.configuration as { policyId?: string }).policyId && (
                            <> · policy <code className="font-mono text-xs">{(t.configuration as { policyId?: string }).policyId}</code></>
                          )}
                        </div>
                      )}
                      {webhookUrl && (
                        <div className="flex items-center gap-2">
                          <code className="font-mono break-all">{webhookUrl}</code>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => copy(webhookUrl, t.id)}
                          >
                            {copiedId === t.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                      <div>
                        Fired {t.triggerCount} time{t.triggerCount === 1 ? '' : 's'}
                        {t.lastTriggered && ` · last ${new Date(t.lastTriggered).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrigger(t.id)}
                    disabled={busy}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
