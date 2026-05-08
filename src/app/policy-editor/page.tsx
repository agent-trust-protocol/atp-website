'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { VisualPolicyEditor } from '@/components/atp/visual-policy-editor';
import { AppShell } from '@/components/layout/AppShell';
import { ProductNav } from '@/components/layout/ProductNav';

export default function PolicyEditorPage() {
  return (
    <RequireAuth tier="professional" feature="visual-policy-editor">
      <AppShell sidebar={<ProductNav />}>
        <div style={{ paddingBottom: '10rem' }}>
          <VisualPolicyEditor />
        </div>
      </AppShell>
    </RequireAuth>
  );
}
