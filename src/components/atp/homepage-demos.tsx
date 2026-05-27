'use client';

import dynamic from 'next/dynamic';

const Placeholder = () => <div className="h-[420px] rounded-xl border bg-muted/20" />;

const QuantumSafeSignatureDemoLite = dynamic(
  () => import('./quantum-safe-signature-demo-lite').then((m) => m.QuantumSafeSignatureDemoLite),
  { ssr: false, loading: Placeholder }
);

const TrustLevelManagementDemo = dynamic(
  () => import('./trust-level-management-demo').then((m) => m.TrustLevelManagementDemo),
  { ssr: false, loading: Placeholder }
);

export function HomepageDemos() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <QuantumSafeSignatureDemoLite />
      <TrustLevelManagementDemo />
    </div>
  );
}
