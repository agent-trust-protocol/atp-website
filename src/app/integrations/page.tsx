import Link from 'next/link';
import { Link2, Cpu, Shield, ArrowRight, Puzzle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Integrations — Agent Trust Protocol',
  description: 'Connect ATP with your existing AI stack. Native integrations for LangChain, MCP, OpenClaw, and more.'
};

const integrations = [
  {
    name: 'LangChain',
    slug: 'langchain',
    icon: Link2,
    description: 'Add quantum-safe trust verification to LangChain agents and chains with a single decorator. Full support for LangGraph workflows.',
    badges: ['Python', 'Quantum-Safe', 'AI Agents'],
    badgeColors: ['bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],
    color: 'from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/20'
  },
  {
    name: 'Model Context Protocol',
    slug: 'mcp',
    icon: Cpu,
    description: 'Secure MCP servers and tool calls with ATP identity verification. Zero-trust architecture for multi-model pipelines.',
    badges: ['TypeScript', 'Zero-Trust', 'Serverless'],
    badgeColors: ['bg-blue-500/10 text-blue-400 border-blue-500/20', 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'],
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20'
  },
  {
    name: 'OpenClaw',
    slug: 'openclaw',
    icon: Shield,
    description: 'Enterprise-grade agent orchestration with ATP trust scoring built in. Manage multi-agent pipelines with policy enforcement.',
    badges: ['Enterprise', 'REST API', 'Multi-Agent'],
    badgeColors: ['bg-purple-500/10 text-purple-400 border-purple-500/20', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'bg-orange-500/10 text-orange-400 border-orange-500/20'],
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/20'
  }
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-2">
            <Puzzle className="h-4 w-4" />
            Native integrations
          </div>
          <h1 className="text-5xl font-bold tracking-tight atp-gradient-text">
            Integrations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Drop ATP into your existing AI stack in minutes. Native SDKs for the frameworks your team already uses — no infrastructure changes required.
          </p>
        </div>
      </section>

      {/* Integration cards */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card
                key={integration.slug}
                className={`glass flex flex-col border ${integration.border} bg-gradient-to-br ${integration.color}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg border ${integration.border} bg-background/50`}>
                      <Icon className="h-5 w-5 text-foreground/80" />
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {integration.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {integration.badges.map((badge, i) => (
                      <Badge
                        key={badge}
                        variant="outline"
                        className={`text-xs ${integration.badgeColors[i]}`}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <Button asChild variant="outline" className="w-full group">
                      <Link href={`/integrations/${integration.slug}`}>
                        View docs
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* More coming soon */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-muted-foreground">
            More integrations coming soon — OpenAI SDK, CrewAI, AutoGen, and more.
          </p>
          <Button asChild variant="ghost">
            <Link href="/request-access">
              Request an integration →
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
