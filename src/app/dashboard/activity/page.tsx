'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Shield,
  GitBranch,
  FileText,
  Mail,
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMe } from '@/hooks/use-me';

type ActivitySource =
  | 'policy_evaluation'
  | 'workflow_execution'
  | 'audit_log'
  | 'tenant_invitation';

interface ActivityEvent {
  id: string;
  source: ActivitySource;
  timestamp: string;
  title: string;
  detail: string | null;
  status: string | null;
  href: string | null;
}

const SOURCE_LABEL: Record<ActivitySource, string> = {
  policy_evaluation: 'Policy',
  workflow_execution: 'Workflow',
  audit_log: 'Audit',
  tenant_invitation: 'Tenant'
};

function SourceIcon({ source }: { source: ActivitySource }) {
  if (source === 'policy_evaluation') return <Shield className="h-4 w-4 text-blue-600" />;
  if (source === 'workflow_execution') return <GitBranch className="h-4 w-4 text-purple-600" />;
  if (source === 'audit_log') return <FileText className="h-4 w-4 text-gray-600" />;
  return <Mail className="h-4 w-4 text-green-600" />;
}

const STATUS_COLOR: Record<string, string> = {
  // Policy decisions
  allow: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  deny: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  throttle: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  require_approval: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  // Workflow execution statuses
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  running: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  // Invitations
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  accepted: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  revoked: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  expired: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

const ALL_SOURCES: ActivitySource[] = [
  'policy_evaluation',
  'workflow_execution',
  'audit_log',
  'tenant_invitation'
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityPage() {
  const me = useMe();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<ActivitySource | ''>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sourceFilter) params.set('source', sourceFilter);
      params.set('limit', '150');
      const r = await fetch(`/api/dashboard/activity?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  const counts = ALL_SOURCES.reduce<Record<ActivitySource, number>>((acc, s) => {
    acc[s] = events.filter((e) => e.source === s).length;
    return acc;
  }, {} as Record<ActivitySource, number>);

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
                <Activity className="h-7 w-7 text-primary" />
                Activity
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Unified timeline of policy decisions, workflow runs, audit
                events, and tenant invitations.
                {me.isFounder && ' Founder view — everything in the system.'}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Source
              </CardTitle>
              <CardDescription>Click a chip to filter the feed by source.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <FilterChip
                active={sourceFilter === ''}
                onClick={() => setSourceFilter('')}
                label={`All (${events.length})`}
              />
              {ALL_SOURCES.map((s) => (
                <FilterChip
                  key={s}
                  active={sourceFilter === s}
                  onClick={() => setSourceFilter(s)}
                  label={`${SOURCE_LABEL[s]} (${counts[s] ?? 0})`}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events ({events.length})</CardTitle>
              <CardDescription>
                Most recent first. Up to 150 shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No activity yet. Run a workflow, evaluate a policy, or
                  invite a teammate and check back.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-3 pl-6 py-2">
                  {events.map((e) => {
                    const content = (
                      <>
                        <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                          <SourceIcon source={e.source} />
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-[10px] py-0">
                            {SOURCE_LABEL[e.source]}
                          </Badge>
                          {e.status && (
                            <Badge variant="outline" className={`text-[10px] py-0 ${STATUS_COLOR[e.status] ?? ''}`}>
                              {e.status}
                            </Badge>
                          )}
                          <span className="font-medium truncate">{e.title}</span>
                        </div>
                        {e.detail && (
                          <p className="text-xs text-muted-foreground break-words">{e.detail}</p>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {timeAgo(e.timestamp)} · {new Date(e.timestamp).toLocaleString()}
                        </div>
                      </>
                    );
                    return (
                      <li
                        key={e.id}
                        className="relative pb-2"
                      >
                        {e.href ? (
                          <Link
                            href={e.href}
                            className="block hover:bg-muted/40 rounded-md -mx-2 px-2 py-1 transition-colors"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="-mx-2 px-2 py-1">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );
}
