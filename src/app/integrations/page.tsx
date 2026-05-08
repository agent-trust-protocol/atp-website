import Link from 'next/link';
import { Link2, Cpu, Shield, ArrowRight, Puzzle, Network, Layers, Globe } from 'lucide-react';

export const metadata = {
  title: 'Integrations — Agent Trust Protocol™',
  description: 'Connect ATP™ with your existing AI stack. Native integrations for LangChain, MCP, OpenClaw, and more.',
};

const INTEGRATIONS = [
  {
    name: 'LangChain',
    slug: 'langchain',
    icon: Link2,
    description: 'Add quantum-safe trust verification to LangChain agents and chains with a single decorator. Full support for LangGraph workflows.',
    badges: ['Python', 'Quantum-Safe', 'AI Agents'],
  },
  {
    name: 'Model Context Protocol',
    slug: 'mcp',
    icon: Cpu,
    description: 'Secure MCP servers and tool calls with ATP identity verification. Zero-trust architecture for multi-model pipelines.',
    badges: ['TypeScript', 'Zero-Trust', 'Serverless'],
  },
  {
    name: 'OpenClaw',
    slug: 'openclaw',
    icon: Shield,
    description: 'Enterprise-grade agent orchestration with ATP trust scoring built in. Manage multi-agent pipelines with policy enforcement.',
    badges: ['Enterprise', 'REST API', 'Multi-Agent'],
  },
];

const MORE = ['Google ADK', 'CrewAI', 'AutoGen', 'Swarm', 'OpenAI SDK', 'Motleycrew'];

export default function IntegrationsPage() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '3.5rem 1.5rem 2.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-highlight)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
            <Puzzle size={11} />
            Native integrations
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            Connect ATP™ to your AI stack
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '52ch', lineHeight: 1.7 }}>
            Drop ATP into the frameworks your team already uses — no infrastructure changes required.
          </p>
        </div>
      </section>

      {/* Integration cards */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {INTEGRATIONS.map(({ name, slug, icon: Icon, description, badges }) => (
            <div key={slug} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <Icon size={18} />
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{name}</p>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1 }}>{description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.25rem' }}>
                {badges.map(badge => (
                  <span key={badge} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                    {badge}
                  </span>
                ))}
              </div>
              <Link href={`/integrations/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
                View docs <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Coming soon */}
      <section style={{ padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '1rem' }}>
            Coming soon
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {MORE.map(name => (
              <span key={name} style={{ fontSize: '0.8125rem', padding: '0.3125rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}>
                {name}
              </span>
            ))}
          </div>
          <Link href="/request-access" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
            Request an integration <ArrowRight size={13} />
          </Link>
        </div>
      </section>

    </div>
  );
}
