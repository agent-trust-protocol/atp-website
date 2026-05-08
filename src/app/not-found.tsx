import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', opacity: 0.4 }}>
          <BrandLogo />
        </div>
        <p style={{ fontSize: '5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text)', lineHeight: 1, marginBottom: '0.75rem' }}>
          404
        </p>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          Page not found
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
