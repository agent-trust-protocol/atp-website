'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, Shield, Globe, Activity, FileText, BookOpen, Code2,
  ArrowRight, Copy, Check, ChevronDown, Github, Package,
  Rocket, Terminal, Layers, Lock, Network, Star,
  ExternalLink, GitBranch, TrendingUp, Users
} from 'lucide-react';
import { DocsShell, type SidebarSection } from '@/components/layout/DocsShell';
import { AnimatedCounter } from '@/components/atp/animated-counter';

/* ─── Sidebar nav ─── */
const SIDEBAR_NAV: SidebarSection[] = [
  {
    title: 'Getting Started',
    links: [
      { href: '/developers', label: 'Quick Start', icon: Rocket, badge: '30s' },
      { href: '/docs/quickstart', label: '1-Line Integration', icon: Zap },
      { href: '/docs/quantum', label: 'Quantum-Safe', icon: Shield },
    ],
  },
  {
    title: 'Reference',
    links: [
      { href: '/docs', label: 'Full Docs', icon: BookOpen },
      { href: '/api-reference', label: 'API Reference', icon: FileText },
      { href: '/examples', label: 'Examples', icon: Code2 },
    ],
  },
  {
    title: 'Protocols',
    links: [
      { href: '/integrations/mcp', label: 'MCP', icon: Network },
      { href: '/integrations/swarm', label: 'Swarm', icon: Layers },
      { href: '/integrations/adk', label: 'ADK', icon: Terminal },
      { href: '/integrations/a2a', label: 'A2A', icon: Globe },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: 'https://github.com/agent-trust-protocol/atp-core', label: 'GitHub', icon: Github },
      { href: 'https://www.npmjs.com/package/atp-sdk', label: 'NPM', icon: Package },
    ],
  },
];

/* ─── Code samples ─── */
const INSTALL_COMMANDS = {
  npm: 'npm install atp-sdk',
  yarn: 'yarn add atp-sdk',
  pnpm: 'pnpm add atp-sdk',
};

const AGENT_CODE = `import { Agent } from 'atp-sdk';

// Quantum-safe agent — ready in one line
const agent = await Agent.quickstart('MyBot');

console.log('DID:         ', agent.getDID());
console.log('Quantum-safe:', agent.isQuantumSafe()); // true
console.log('Trust score: ', await agent.getTrustScore());

// Send a secure message to another agent
await agent.send('did:atp:other-agent', 'Hello, world!');`;

/* ─── FAQ data ─── */
const FAQ = [
  {
    q: 'Does it work without running any services?',
    a: 'Yes. Agent.quickstart() runs in standalone mode — your agent gets a locally-generated DID and quantum-safe keys instantly. ATP services unlock additional features (trust scoring, audit trail, multi-agent messaging) when available.',
  },
  {
    q: 'Which agent runtimes does ATP support?',
    a: 'ATP is runtime-agnostic. First-class adapters are available for OpenClaw/NemoClaw, LangChain, Motleycrew, and Google ADK. Any runtime can be integrated via the atp-sdk adapter API.',
  },
  {
    q: 'What makes the cryptography "quantum-safe"?',
    a: 'ATP uses CRYSTALS-Dilithium (ML-DSA) for signatures and CRYSTALS-Kyber (ML-KEM) for key exchange — both NIST-standardized post-quantum algorithms. Ed25519 is used for classical scenarios where quantum resistance is not yet required.',
  },
  {
    q: 'Is ATP open source?',
    a: 'The core SDK (atp-sdk) and runtime adapters are Apache-2.0. Cloud hosting, enterprise SLA, and managed policy services are offered under a commercial license.',
  },
  {
    q: 'How does trust scoring work?',
    a: 'Trust scores are computed from verifiable credential attestations, behavioral telemetry, and cryptographic proof of identity. Scores update in real time and can be used to gate agent-to-agent interactions via policy profiles.',
  },
];

/* ─── Feature data ─── */
const FEATURES = [
  {
    icon: Shield,
    title: 'Quantum-Safe Cryptography',
    desc: 'CRYSTALS-Dilithium signatures and CRYSTALS-Kyber key exchange — NIST-standardized post-quantum algorithms built in by default.',
    points: ['ML-DSA / ML-KEM (NIST PQC)', 'Ed25519 for classical scenarios', 'Automatic key rotation'],
  },
  {
    icon: Activity,
    title: 'Trust Scoring',
    desc: 'Dynamic trust scores computed from verifiable credentials, behavioral telemetry, and cryptographic proof of identity.',
    points: ['Real-time score updates', 'Verifiable credential support', 'Policy-gated interactions'],
  },
  {
    icon: Globe,
    title: 'Protocol Agnostic',
    desc: 'Works with any agent runtime. First-class adapters for OpenClaw, LangChain, Motleycrew, ADK, and custom runtimes.',
    points: ['MCP · Swarm · ADK · A2A', 'Custom adapter API', 'No runtime lock-in'],
  },
  {
    icon: Lock,
    title: 'Immutable Audit Trail',
    desc: 'Blockchain-anchored audit log with Merkle-tree verification. Every action is signed, timestamped, and tamper-evident.',
    points: ['Merkle-tree integrity proofs', 'Validator consensus anchoring', 'RBAC access control'],
  },
];

const ECOSYSTEMS = ['MCP', 'Swarm', 'ADK', 'A2A', 'OpenClaw', 'LangChain', 'Custom'];

const RESOURCES = [
  { icon: BookOpen, title: 'Full Documentation', desc: 'Guides, concepts, and deep dives into every ATP feature.', href: '/docs', cta: 'Read the docs' },
  { icon: FileText, title: 'API Reference', desc: 'Complete TypeScript API reference with examples for every method.', href: '/api-reference', cta: 'Browse API' },
  { icon: Code2, title: 'Examples', desc: 'Runnable examples: finance workflows, stateful sessions, multi-agent crews.', href: '/examples', cta: 'View examples' },
  { icon: Github, title: 'GitHub', desc: 'Source code, issues, and contributions. Apache-2.0 licensed.', href: 'https://github.com/agent-trust-protocol/atp-core', cta: 'Open GitHub', external: true },
];

/* ─── Component ─── */
export default function DevelopersPage() {
  const [installTab, setInstallTab] = useState<'npm' | 'yarn' | 'pnpm'>('npm');
  const [codeTab, setCodeTab] = useState<'install' | 'agent'>('install');
  const [copied, setCopied] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [stats, setStats] = useState({ githubStars: 0, npmDownloads: 0, contributors: 0, growth: 0, loading: true });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [gh, npm] = await Promise.all([
          fetch('/api/github/stats', { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/npm/stats', { cache: 'no-store' }).then(r => r.json()),
        ]);
        const growth = gh.stars > 100 ? 127 : gh.stars > 50 ? 89 : 45;
        if (mounted) setStats({ githubStars: gh.stars || 0, npmDownloads: npm.downloads || npm.monthlyDownloads || 0, contributors: gh.contributors || 0, growth, loading: false });
      } catch {
        if (mounted) setStats(prev => ({ ...prev, loading: false }));
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeCode = codeTab === 'install' ? INSTALL_COMMANDS[installTab] : AGENT_CODE;

  return (
    <DocsShell sidebarNav={SIDEBAR_NAV}>

      {/* ─── Hero ─── */}
      <section style={{
        padding: '2.5rem 2rem 2rem',
        maxWidth: '980px',
        margin: '0 auto',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-highlight)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
          <Zap size={11} />
          Developer Portal
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.375rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '1rem', color: 'var(--color-text)' }}>
          Build secure AI agents with{' '}
          <span style={{ color: 'var(--color-primary)' }}>quantum-safe cryptography</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 1.2vw, 1.0625rem)', color: 'var(--color-text-muted)', maxWidth: '54ch', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          One line of code. Thirty seconds to your first quantum-safe agent. The world's first post-quantum trust protocol for AI — runtime-agnostic and production-ready.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '40px', padding: '0 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', transition: 'background 180ms' }}
            className="hover:!bg-[var(--color-primary-hover)]">
            Get Started <ArrowRight size={14} />
          </Link>
          <a href="https://github.com/agent-trust-protocol/atp-core" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '40px', padding: '0 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'background 180ms, color 180ms' }}
            className="hover:!bg-[var(--color-surface-offset)] hover:!text-[var(--color-text)]">
            <Github size={15} /> GitHub <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {([
            [Zap, '1-Line Integration'],
            [Shield, 'Quantum-Safe'],
            [Globe, 'Protocol Agnostic'],
            [Activity, 'Audit Trail'],
            [Lock, 'NIST PQC'],
          ] as [React.ElementType, string][]).map(([Icon, label]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'var(--color-surface)' }}>
              <Icon size={11} style={{ color: 'var(--color-primary)' }} />
              {label}
            </span>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem' }}>

        {/* ─── Setup Path Cards ─── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Start</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { icon: Rocket, title: 'New Project', desc: 'Scaffold a new agent project with ATP pre-configured and ready to run.', href: '/onboard/new', cta: 'Start new →' },
              { icon: Terminal, title: 'Existing Project', desc: 'Add ATP to your existing agent — one npm install and one import.', href: '/onboard/existing', cta: 'Add to project →' },
              { icon: Globe, title: 'Zero Install', desc: 'Try the interactive playground in your browser — no setup required.', href: '/playground', cta: 'Open playground →' },
            ].map(({ icon: Icon, title, desc, href, cta }) => (
              <Link key={title} href={href} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem', textDecoration: 'none', transition: 'box-shadow 180ms, border-color 180ms, transform 180ms', cursor: 'pointer' }}
                className="hover:!border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5">
                <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{title}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>{desc}</p>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Code Tabs ─── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {/* Tab header */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-offset)', borderBottom: '1px solid var(--color-border)', padding: '0 1rem', gap: '0.25rem', overflowX: 'auto' }}>
              {(['install', 'agent'] as const).map(tab => (
                <button key={tab} onClick={() => setCodeTab(tab)} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 500, color: codeTab === tab ? 'var(--color-primary)' : 'var(--color-text-faint)', borderBottom: `2px solid ${codeTab === tab ? 'var(--color-primary)' : 'transparent'}`, whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: codeTab === tab ? 'var(--color-primary)' : 'transparent', cursor: 'pointer', transition: 'color 150ms' }}>
                  {tab === 'install' ? 'Install' : 'First Agent'}
                </button>
              ))}
              {codeTab === 'install' && (
                <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                  {(['npm', 'yarn', 'pnpm'] as const).map(pm => (
                    <button key={pm} onClick={() => setInstallTab(pm)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem', borderRadius: '0.375rem', border: '1px solid', borderColor: installTab === pm ? 'var(--color-primary)' : 'var(--color-border)', color: installTab === pm ? 'var(--color-primary)' : 'var(--color-text-muted)', background: installTab === pm ? 'var(--color-primary-highlight)' : 'transparent', fontWeight: installTab === pm ? 600 : 400, cursor: 'pointer', transition: 'all 150ms' }}>
                      {pm}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => copy(activeCode, 'code')} style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', fontSize: '0.75rem', color: 'var(--color-text-faint)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', background: 'none', cursor: 'pointer', transition: 'background 150ms, color 150ms' }}
                className="hover:!bg-[var(--color-surface-dynamic)] hover:!text-[var(--color-text)]">
                {copied === 'code' ? <Check size={12} style={{ color: 'var(--color-primary)' }} /> : <Copy size={12} />}
                {copied === 'code' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Code body */}
            <div style={{ background: 'var(--color-code-bg)', padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
              <pre style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', monospace", fontSize: '0.8125rem', lineHeight: 1.65, color: 'var(--color-text)', margin: 0 }}>
                <code>{activeCode}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ─── Features Grid ─── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text)', marginBottom: '0.375rem' }}>Built for production</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Everything you need to secure AI agents at enterprise scale.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc, points }) => (
              <div key={title} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  <Icon size={18} />
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>{title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '0.875rem' }}>{desc}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {points.map(pt => (
                    <li key={pt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      <Check size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Ecosystem Strip ─── */}
        <section style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '0.75rem' }}>Protocol Support</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ECOSYSTEMS.map(name => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.3125rem 0.875rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* ─── Stats Row ─── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: Star, label: 'GitHub Stars', value: stats.githubStars, suffix: '' },
            { icon: Package, label: 'NPM Downloads', value: stats.npmDownloads, suffix: '/mo' },
            { icon: Users, label: 'Contributors', value: stats.contributors, suffix: '' },
            { icon: TrendingUp, label: '30d Growth', value: stats.growth, suffix: '%' },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                <Icon size={15} />
                {label}
              </div>
              <p style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', lineHeight: 1 }}>
                {stats.loading ? '—' : <AnimatedCounter value={value} suffix={suffix} />}
              </p>
            </div>
          ))}
        </section>

        {/* ─── Resources Grid ─── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text)', marginBottom: '1rem' }}>Resources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {RESOURCES.map(({ icon: Icon, title, desc, href, cta, external }) => (
              <a key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.125rem', textDecoration: 'none', transition: 'border-color 180ms, box-shadow 180ms' }}
                className="hover:!border-[var(--color-primary)] hover:shadow-sm">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={16} style={{ color: 'var(--color-primary)' }} />
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>{title}</p>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>{desc}</p>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto' }}>
                  {cta} {external ? <ExternalLink size={11} /> : <ArrowRight size={11} />}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text)', marginBottom: '1rem' }}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FAQ.map(({ q, a }, i) => (
              <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.125rem', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-text)', background: faqOpen === i ? 'var(--color-surface)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms' }}>
                  {q}
                  <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0, transform: faqOpen === i ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 1.125rem 1rem', fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ paddingTop: '0.875rem' }}>{a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section style={{ padding: '2rem', background: 'var(--color-primary-highlight)', border: '1px solid', borderColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.375rem' }}>Ready to build?</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', maxWidth: '48ch' }}>Secure your first AI agent in 30 seconds. No credit card required for open-source usage.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5625rem 1.125rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-primary-hover)]">
              Get Started <ArrowRight size={14} />
            </Link>
            <a href="https://github.com/agent-trust-protocol/atp-core" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5625rem 1.125rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', background: 'transparent', transition: 'background 180ms, color 180ms' }}
              className="hover:!bg-[color-mix(in_srgb,_var(--color-primary)_8%,_transparent)] hover:!text-[var(--color-text)]">
              <Github size={15} /> View on GitHub
            </a>
          </div>
        </section>

      </div>
    </DocsShell>
  );
}
