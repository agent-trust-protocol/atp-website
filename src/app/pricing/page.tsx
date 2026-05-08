import Link from 'next/link';
import { Check, ArrowRight, Github, Building2, Cloud, X } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Agent Trust Protocol™',
  description: 'OpenCore pricing: start free with open source; upgrade to Cloud or Enterprise when you need more.',
};

const TIERS = [
  {
    name: 'Open Source',
    price: '$0',
    period: 'forever free',
    description: 'Complete ATP protocol, self-hosted.',
    cta: 'Get started free',
    ctaHref: 'https://github.com/agent-trust-protocol/atp-core',
    ctaExternal: true,
    highlight: false,
    icon: Github,
    features: [
      'Core ATP protocol',
      '3-line SDK integration',
      'Quantum-safe cryptography',
      'W3C DID/VC standards',
      'Basic trust scoring',
      'Up to 10 agents',
      'Self-hosted deployment',
      'Community support',
    ],
  },
  {
    name: 'Cloud',
    price: '$29',
    period: 'per month',
    description: 'Fully managed, zero infrastructure.',
    cta: 'Start free trial',
    ctaHref: '/request-access',
    ctaExternal: false,
    highlight: true,
    badge: 'Most Popular',
    icon: Cloud,
    features: [
      'Everything in Open Source',
      'Hosted SaaS platform',
      'Up to 100 agents',
      '250K requests/month',
      'Advanced dashboard',
      'Email + chat support',
      '99.9% uptime SLA',
      'Managed updates',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact sales',
    description: 'Unlimited scale, compliance, SLA.',
    cta: 'Talk to sales',
    ctaHref: '/contact',
    ctaExternal: false,
    highlight: false,
    icon: Building2,
    features: [
      'Everything in Cloud',
      'Unlimited agents',
      'Enterprise SSO / SAML',
      'RBAC & audit trail',
      'SOC 2, HIPAA, GDPR',
      'High availability clustering',
      'Dedicated support & SLA',
      '30-day enterprise trial',
    ],
  },
];

const TABLE_ROWS: { feature: string; os: string | boolean; cloud: string | boolean; enterprise: string | boolean }[] = [
  { feature: 'ATP Protocol Core',           os: true,            cloud: true,         enterprise: true },
  { feature: 'Quantum-Safe Signatures',     os: true,            cloud: true,         enterprise: true },
  { feature: 'Basic Monitoring',            os: true,            cloud: true,         enterprise: true },
  { feature: 'Advanced Dashboard',          os: false,           cloud: true,         enterprise: true },
  { feature: 'Enterprise SSO',              os: false,           cloud: false,        enterprise: true },
  { feature: 'Compliance Reporting',        os: false,           cloud: false,        enterprise: true },
  { feature: 'High Availability',           os: false,           cloud: true,         enterprise: true },
  { feature: 'Support',                     os: 'Community',     cloud: 'Email + chat', enterprise: '24/7 dedicated' },
  { feature: 'Deployment',                  os: 'Self-hosted',   cloud: 'Fully managed', enterprise: 'Both' },
  { feature: 'SLA',                         os: '—',             cloud: '99.9%',      enterprise: 'Custom' },
];

const FAQS = [
  {
    q: 'Is the open source version really free?',
    a: 'Yes. The ATP core protocol is 100% open source under Apache 2.0. You get the complete quantum-safe agent security stack with no usage fees, no credit card required.',
  },
  {
    q: "What's included in the Cloud plan?",
    a: 'Cloud is a fully managed hosted service — no infrastructure to run. It includes the advanced dashboard, 99.9% uptime SLA, up to 100 agents, 250K requests/month, and email + chat support.',
  },
  {
    q: 'Can I migrate from open source to Cloud or Enterprise?',
    a: 'Yes. ATP is designed for seamless migration. Your data and configurations transfer directly, and our team assists with any custom setup.',
  },
  {
    q: 'Do you offer volume discounts?',
    a: 'Yes. We offer custom pricing for large deployments, multi-year contracts, and academic institutions. Contact our sales team.',
  },
  {
    q: 'How does the Enterprise 30-day trial work?',
    a: 'Get full Enterprise access for 30 days with dedicated onboarding support. No credit card required. Includes custom configuration for your environment.',
  },
  {
    q: 'What support is included with each plan?',
    a: 'Open Source includes community support via GitHub. Cloud includes email + chat support. Enterprise includes 24/7 dedicated support with custom SLAs.',
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} style={{ color: 'var(--color-primary)', margin: '0 auto' }} />;
  if (value === false) return <X size={16} style={{ color: 'var(--color-text-faint)', margin: '0 auto' }} />;
  return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{value}</span>;
}

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '3.5rem 1.5rem 2.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-highlight)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
            Apache 2.0 · Open Core
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '48ch', margin: '0 auto', lineHeight: 1.7 }}>
            Start free with the open source core. Upgrade to Cloud or Enterprise when your team needs more scale, compliance, or support.
          </p>
        </div>
      </section>

      {/* Tier cards */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {TIERS.map(({ name, price, period, description, cta, ctaHref, ctaExternal, highlight, badge, icon: Icon, features }) => (
            <div
              key={name}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'var(--color-surface)',
                border: highlight ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: '1rem',
                padding: highlight ? '1.5rem' : '1.5rem',
              }}
            >
              {badge && (
                <div style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff', background: 'var(--color-primary)', padding: '0.1875rem 0.625rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                  {badge}
                </div>
              )}

              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '0.625rem', background: highlight ? 'var(--color-primary)' : 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: highlight ? '#fff' : 'var(--color-primary)', flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{name}</p>
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{price}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginLeft: '0.375rem' }}>{period}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{description}</p>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <Check size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {ctaExternal ? (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, padding: '0.625rem 1rem', borderRadius: '0.5rem', background: highlight ? 'var(--color-primary)' : 'var(--color-bg)', border: highlight ? 'none' : '1px solid var(--color-border)', color: highlight ? '#fff' : 'var(--color-text)', textDecoration: 'none', cursor: 'pointer' }}
                >
                  {cta} <ArrowRight size={13} />
                </a>
              ) : (
                <Link
                  href={ctaHref}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, padding: '0.625rem 1rem', borderRadius: '0.5rem', background: highlight ? 'var(--color-primary)' : 'var(--color-bg)', border: highlight ? 'none' : '1px solid var(--color-border)', color: highlight ? '#fff' : 'var(--color-text)', textDecoration: 'none' }}
                >
                  {cta} <ArrowRight size={13} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '1.25rem' }}>
            Feature comparison
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8125rem' }}>Feature</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8125rem' }}>Open Source</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>Cloud</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8125rem' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}><Cell value={row.os} /></td>
                    <td style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'var(--color-primary-highlight)' }}><Cell value={row.cloud} /></td>
                    <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}><Cell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '1.25rem' }}>
            FAQ
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {FAQS.map(({ q, a }, i) => (
              <details
                key={q}
                style={{ borderTop: i === 0 ? '1px solid var(--color-border)' : 'none', borderBottom: '1px solid var(--color-border)' }}
              >
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', cursor: 'pointer', listStyle: 'none', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', userSelect: 'none' }}>
                  {q}
                  <span style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '1rem' }}>+</span>
                </summary>
                <p style={{ padding: '0 0 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0 }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            Ready to secure your agents?
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '44ch', margin: '0 auto 1.5rem' }}>
            Start with open source today, upgrade when you need enterprise features.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <a
              href="https://github.com/agent-trust-protocol/atp-core"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }}
            >
              Get started free <ArrowRight size={13} />
            </a>
            <Link
              href="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', textDecoration: 'none' }}
            >
              Talk to sales <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
