'use client';

import Link from 'next/link';
import { Zap, X } from 'lucide-react';
import { useState } from 'react';
import { useMe } from '@/hooks/use-me';

/**
 * Persistent indicator badge shown on every page when the signed-in user
 * matches FOUNDER_EMAIL. Solves "is founder mode actually on?" without
 * needing to inspect /api/me by hand.
 *
 * Click goes to /admin/diagnostic for full self-service troubleshooting.
 * The dismiss × hides the badge for the current tab session only — a
 * full reload brings it back, so it can't be permanently lost.
 */
export function FounderModeIndicator() {
  const me = useMe();
  const [dismissed, setDismissed] = useState(false);

  if (!me.isFounder || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500 text-black px-3 py-1.5 shadow-lg text-xs font-medium">
        <Zap className="h-3.5 w-3.5" />
        <Link href="/admin/diagnostic" className="hover:underline">
          Founder mode active
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-1 -mr-1 rounded-full hover:bg-black/10 p-0.5"
          aria-label="Hide founder mode badge"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
