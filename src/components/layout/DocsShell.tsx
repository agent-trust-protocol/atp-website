'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
};

export type SidebarSection = {
  title: string;
  links: SidebarLink[];
};

type DocsShellProps = {
  children: React.ReactNode;
  sidebarNav?: SidebarSection[];
  /** Hide sidebar entirely for this page */
  noSidebar?: boolean;
};

export function DocsShell({ children, sidebarNav, noSidebar }: DocsShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (noSidebar || !sidebarNav) {
    return <div style={{ flex: 1 }}>{children}</div>;
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          width: '240px',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          height: 'calc(100dvh - 56px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '1.5rem 1rem',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <SidebarContent sidebarNav={sidebarNav} isActive={isActive} />
      </aside>

      {/* Mobile collapsible nav */}
      <div className="lg:hidden" style={{ width: '100%' }}>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <span>Navigation</span>
          {mobileNavOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {mobileNavOpen && (
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <SidebarContent
              sidebarNav={sidebarNav}
              isActive={isActive}
              onLinkClick={() => setMobileNavOpen(false)}
            />
          </div>
        )}
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>

      {/* Desktop main content */}
      <main className="hidden lg:block" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

function SidebarContent({
  sidebarNav,
  isActive,
  onLinkClick,
}: {
  sidebarNav: SidebarSection[];
  isActive: (href: string) => boolean;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {sidebarNav.map((section) => (
        <div key={section.title}>
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              padding: '0 0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            {section.title}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {section.links.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.4375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: active ? 'var(--color-primary-highlight)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    textDecoration: 'none',
                    transition: 'background 150ms, color 150ms',
                  }}
                  className={!active ? 'hover:!bg-[var(--color-surface-offset)] hover:!text-[var(--color-text)]' : ''}
                >
                  {Icon && <Icon size={15} style={{ flexShrink: 0, opacity: 0.75 }} />}
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: 'var(--color-primary-highlight)',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        marginLeft: 'auto',
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </>
  );
}
