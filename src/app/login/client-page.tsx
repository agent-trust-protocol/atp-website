'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithMagicLink } from '@/lib/auth-client';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';

function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('returnTo') || '/portal';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithMagicLink(email, returnTo);
      setMagicLinkSent(true);
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle size={22} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem', textAlign: 'center' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '0.375rem' }}>
            We sent a sign-in link to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-faint)', textAlign: 'center', marginBottom: '1.5rem' }}>
            The link expires in 15 minutes.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setEmail(''); }}
            style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <BrandLogo />
        </div>

        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: '0.375rem' }}>
          Sign in to ATP™
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
          Manage your subscription and API access
        </p>

        <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'color-mix(in srgb, #ef4444 8%, transparent)', border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)', color: '#b91c1c', fontSize: '0.875rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="email" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 1rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            <Mail size={14} />
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', textAlign: 'center' }}>
            We'll email you a secure link — no password needed.
          </p>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.25rem 0' }} />

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Access is invite-only.{' '}
          <Link href="/request-access" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
            Request an invite →
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-bg)',
  padding: '1.5rem',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '1rem',
  padding: '2rem',
};

export default function LoginClient() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
