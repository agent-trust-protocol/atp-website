'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ProductNav } from '@/components/layout/ProductNav';

const MonitoringDashboard = dynamic(
  () => import('@/components/atp/monitoring-dashboard').then(mod => ({ default: mod.MonitoringDashboard })),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading monitoring dashboard...</p>
        </div>
      </div>
    ),
  }
);

export default function MonitoringPage() {
  return (
    <AppShell sidebar={<ProductNav />}>
      <MonitoringDashboard />
    </AppShell>
  );
}
