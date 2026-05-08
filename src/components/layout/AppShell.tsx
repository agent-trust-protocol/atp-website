import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
  /** Optional breadcrumb shown in the top bar beside the logo */
  breadcrumb?: ReactNode;
  /** Optional sidebar content (product nav) */
  sidebar?: ReactNode;
};

/**
 * Minimal product/authenticated shell.
 * Wraps content with consistent padding and an optional sidebar slot.
 * Phase 1 is intentionally minimal — Phase 5 will expand it with full product nav.
 */
export function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {sidebar && (
        <aside
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
          }}
        >
          {sidebar}
        </aside>
      )}
      <main style={{ flex: 1, minWidth: 0, padding: '2.5rem 2rem', maxWidth: '980px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
