'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Github, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/developers', label: 'Developers' },
  { href: '/docs', label: 'Docs' },
  { href: '/examples', label: 'Examples' },
  { href: '/api-reference', label: 'API Reference' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0 1.5rem',
          background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          className="hover:opacity-80 transition-opacity"
        >
          <BrandLogo size={28} />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em', color: 'var(--color-text)' }}>
            ATP™
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '1rem' }} className="hidden lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: isActive(href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isActive(href) ? 'var(--color-primary-highlight)' : 'transparent',
                fontWeight: isActive(href) ? 500 : 400,
                textDecoration: 'none',
                transition: 'color 180ms, background 180ms',
              }}
              className={!isActive(href) ? 'hover:!text-[var(--color-text)] hover:!bg-[var(--color-surface-offset)]' : ''}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.625rem' }} className="hidden lg:flex">
          <a
            href="https://github.com/agent-trust-protocol/atp-core"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              transition: 'background 180ms, color 180ms, border-color 180ms',
            }}
            className="hover:!bg-[var(--color-surface-offset)] hover:!text-[var(--color-text)] hover:!border-[var(--color-text-faint)]"
          >
            <Github size={15} />
            GitHub
          </a>
          <ThemeToggle />
          <Link
            href="/developers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.875rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: 'var(--color-primary)',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 180ms',
            }}
            className="hover:!bg-[var(--color-primary-hover)]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="flex lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 180ms',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            inset: '56px 0 0 0',
            zIndex: 90,
            background: 'var(--color-bg)',
            padding: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            overflowY: 'auto',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                color: isActive(href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isActive(href) ? 'var(--color-primary-highlight)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive(href) ? 500 : 400,
                transition: 'background 180ms, color 180ms',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <a
              href="https://github.com/agent-trust-protocol/atp-core"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              <Github size={16} />
              GitHub
            </a>
            <Link
              href="/developers"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 500,
                background: 'var(--color-primary)',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
