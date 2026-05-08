'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shield, Play, FileCode2, Activity, Key, Terminal, Building2 } from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/monitoring', label: 'Monitoring', icon: Activity },
    ],
  },
  {
    title: 'Policy',
    items: [
      { href: '/policies', label: 'Policy Management', icon: Shield },
      { href: '/policy-editor', label: 'Policy Editor', icon: FileCode2 },
      { href: '/policy-testing', label: 'Policy Testing', icon: Play },
    ],
  },
  {
    title: 'Developer',
    items: [
      { href: '/portal', label: 'API Keys', icon: Key },
      { href: '/developers', label: 'Developer Portal', icon: Terminal },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/enterprise', label: 'Enterprise', icon: Building2 },
    ],
  },
];

export function ProductNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {SECTIONS.map(section => (
        <div key={section.title}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: '0.375rem', padding: '0 0.5rem' }}>
            {section.title}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      background: active ? 'var(--color-primary-highlight)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 150ms, color 150ms',
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
