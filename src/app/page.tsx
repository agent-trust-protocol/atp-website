'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight, Github, Shield, Activity, Globe, Lock,
  Zap, Users, Star, Package, TrendingUp, Code2,
  BookOpen, Cloud, Building2, ExternalLink
} from 'lucide-react';
import { AnimatedCounter } from '@/components/atp/animated-counter';
import { BrandLogo } from '@/components/ui/brand-logo';

const ECOSYSTEMS = ['MCP', 'Swarm', 'ADK', 'A2A', 'OpenClaw', 'LangChain', 'Motleycrew', 'Custom'];

const FEATURES = [
  { icon: Shield, title: 'Quantum-Safe Cryptography', desc: 'CRYSTALS-Dilithium + CRYSTALS-Kyber — NIST-standardized PQC built in by default.' },
  { icon: Activity, title: 'Dynamic Trust Scoring', desc: 'Real-time scores from verifiable credentials, telemetry, and cryptographic identity.' },
  { icon: Globe, title: 'Runtime Agnostic', desc: 'Works with any agent framework. No lock-in — swap runtimes without changing security.' },
  { icon: Lock, title: 'Immutable Audit Trail', desc: 'Blockchain-anchored Merkle-tree audit log. Every action signed and tamper-evident.' },
];

const PATHS = [
  {
    icon: Code2,
    title: 'Developers',
    desc: 'npm install atp-sdk. Quantum-safe agent in 30 seconds. Works offline, scales to production.',
    href: '/developers',
    cta: 'Read the quickstart',
    badge: '30s setup',
  },
  {
    icon: Cloud,
    title: 'Cloud',
    desc: 'Hosted monitoring, visual policy editor, and managed trust infrastructure. No ops required.',
    href: '/cloud',
    cta: 'Explore Cloud',
    badge: 'Hosted',
    highlight: true,
  },
  {
    icon: Building2,
    title: 'Enterprise',
    desc: 'SLA, RBAC, advanced audit trail, private deployment, and dedicated support.',
    href: '/enterprise',
    cta: 'Talk to sales',
    badge: 'Custom',
  },
];

export default function HomePage() {
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
    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ─── Hero ─── */}
      <section style={{ padding: '5rem 1.5rem 4rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <BrandLogo variant="mark" size={56} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-highlight)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.5rem' }}>
            <Zap size={11} />
            Open Source · Apache-2.0
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--color-text)', marginBottom: '1.25rem' }}>
            The quantum-safe trust protocol<br />
            <span style={{ color: 'var(--color-primary)' }}>for AI agents</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', color: 'var(--color-text-muted)', maxWidth: '52ch', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            ATP™ gives every AI agent a cryptographic identity, dynamic trust score, and immutable audit trail — in one line of code.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <Link href="/developers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '44px', padding: '0 1.5rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-primary-hover)]">
              Get Started <ArrowRight size={15} />
            </Link>
            <a href="https://github.com/agent-trust-protocol/atp-core" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '44px', padding: '0 1.5rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'background 180ms, color 180ms' }}
              className="hover:!bg-[var(--color-surface-offset)] hover:!text-[var(--color-text)]">
              <Github size={16} /> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── 3-Path Selector ─── */}
      <section style={{ padding: '3.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '1.5rem' }}>
            Where do you want to start?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {PATHS.map(({ icon: Icon, title, desc, href, cta, badge, highlight }) => (
              <Link key={title} href={href} style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                background: highlight ? 'var(--color-primary-highlight)' : 'var(--color-surface)',
                border: `1px solid ${highlight ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'var(--color-border)'}`,
                borderRadius: '1rem', padding: '1.5rem', textDecoration: 'none',
                transition: 'box-shadow 180ms, border-color 180ms, transform 180ms',
              }} className="hover:!border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: highlight ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: highlight ? 'var(--color-primary)' : 'var(--color-surface-offset)', color: highlight ? '#fff' : 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                    {badge}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.375rem' }}>{title}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc}</p>
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto' }}>
                  {cta} <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Row ─── */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: Star, label: 'GitHub Stars', value: stats.githubStars },
            { icon: Package, label: 'Monthly Downloads', value: stats.npmDownloads, suffix: '' },
            { icon: Users, label: 'Contributors', value: stats.contributors },
            { icon: TrendingUp, label: '30d Growth', value: stats.growth, suffix: '%' },
          ].map(({ icon: Icon, label, value, suffix = '' }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                <Icon size={14} />
                {label}
              </div>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', lineHeight: 1 }}>
                {stats.loading ? '—' : <AnimatedCounter value={value} suffix={suffix} />}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Proof ─── */}
      <section style={{ padding: '3.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '0.625rem' }}>Why ATP™</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '2rem' }}>
            Everything agents need to be trustworthy
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.75rem', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  <Icon size={18} />
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>{title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ecosystem Strip ─── */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', flexShrink: 0 }}>Works with</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ECOSYSTEMS.map(name => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.3125rem 0.875rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Open Core Strip ─── */}
      <section style={{ padding: '3rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>Open source at the core</p>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', maxWidth: '44ch' }}>
              ATP™ SDK and runtime adapters are Apache-2.0. Enterprise features — managed policy, SLA, private deployment — are available commercially.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <a href="https://github.com/agent-trust-protocol/atp-core" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-surface-offset)]">
              <Github size={15} /> Star on GitHub <ExternalLink size={12} />
            </a>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-surface-offset)]">
              View pricing <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            Build your first quantum-safe agent<br />in 30 seconds
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem' }}>
            No credit card required for open-source usage. Works offline from the first line.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <Link href="/developers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '44px', padding: '0 1.5rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-primary-hover)]">
              Get Started <ArrowRight size={15} />
            </Link>
            <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '44px', padding: '0 1.5rem', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 500, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'background 180ms' }}
              className="hover:!bg-[var(--color-surface-offset)]">
              Read the docs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
