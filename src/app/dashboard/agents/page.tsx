'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Shield, Building, Star, Users, UserPlus, Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Agent {
  id: string;
  name: string;
  did: string;
  organization: string;
  trustLevel: 'untrusted' | 'basic' | 'verified' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  lastSeen: string;
}

const DEMO_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Enterprise Bot Alpha',
    did: 'did:atp:enterprise:abc123',
    organization: 'Acme Corp',
    trustLevel: 'enterprise',
    status: 'active',
    lastSeen: '2 minutes ago'
  },
  {
    id: '2',
    name: 'Analytics Agent',
    did: 'did:atp:verified:def456',
    organization: 'DataOps Inc',
    trustLevel: 'verified',
    status: 'active',
    lastSeen: '18 minutes ago'
  },
  {
    id: '3',
    name: 'Support Bot v2',
    did: 'did:atp:basic:ghi789',
    organization: '',
    trustLevel: 'basic',
    status: 'inactive',
    lastSeen: '3 days ago'
  },
  {
    id: '4',
    name: 'Monitoring Agent',
    did: 'did:atp:premium:jkl012',
    organization: 'SRE Team',
    trustLevel: 'premium',
    status: 'active',
    lastSeen: '5 minutes ago'
  }
];

function trustLevelIcon(level: string) {
  switch (level) {
    case 'enterprise': return <Building className="h-3.5 w-3.5" />;
    case 'premium': return <Star className="h-3.5 w-3.5" />;
    case 'verified': return <Shield className="h-3.5 w-3.5" />;
    case 'basic': return <UserPlus className="h-3.5 w-3.5" />;
    default: return <Users className="h-3.5 w-3.5" />;
  }
}

function trustLevelColor(level: string) {
  switch (level) {
    case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
    case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'verified': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
    case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

export default function AgentsPage() {
  const [search, setSearch] = useState('');

  const filtered = DEMO_AGENTS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.did.toLowerCase().includes(search.toLowerCase()) ||
    a.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Registered Agents</h1>
              <p className="text-muted-foreground mt-1">
                Manage agents in the trust protocol network
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(['enterprise', 'verified', 'premium', 'basic'] as const).map(level => {
            const count = DEMO_AGENTS.filter(a => a.trustLevel === level).length;
            return (
              <Card key={level}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {trustLevelIcon(level)}
                    <span className="text-xs font-medium capitalize text-muted-foreground">{level}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search + list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agents ({filtered.length})</CardTitle>
                <CardDescription>Registered agents and their trust levels</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No agents found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{agent.name}</p>
                        <Badge className={`text-xs flex items-center gap-1 ${trustLevelColor(agent.trustLevel)}`}>
                          {trustLevelIcon(agent.trustLevel)}
                          {agent.trustLevel}
                        </Badge>
                        <Badge className={`text-xs ${statusColor(agent.status)}`}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{agent.did}</p>
                      {agent.organization && (
                        <p className="text-xs text-muted-foreground">{agent.organization}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Last seen<br />
                      <span className="font-medium">{agent.lastSeen}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
