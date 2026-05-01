'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreflightCheck } from '@/components/onboard/PreflightCheck';

export default function DashboardOnlyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const handleReady = useCallback((r: boolean) => setReady(r), []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <button
            onClick={() => router.push('/onboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to setup paths
          </button>
          <h1 className="text-2xl font-bold">Explore the Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Open the local ATP dashboard without committing to a full project setup. Great for evaluating
            what ATP can do before you install anything.
          </p>
        </div>

        <PreflightCheck onReady={handleReady} />

        <Button
          size="lg"
          className="w-full flex items-center justify-center gap-2"
          disabled={!ready}
          onClick={() => router.push('/dashboard')}
        >
          <LayoutDashboard className="h-5 w-5" />
          Open Local Dashboard
        </Button>

        {!ready && (
          <p className="text-xs text-center text-muted-foreground">
            The button enables once all environment checks pass.
          </p>
        )}
      </div>
    </div>
  );
}
