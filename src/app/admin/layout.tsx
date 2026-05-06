'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky founder bar */}
      <div className="sticky top-0 z-50 bg-yellow-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-3">
          <span className="font-bold">⚡ FOUNDER MODE</span>
          <span className="opacity-60">|</span>
          <Link href="/admin" className="hover:underline">
            Testing Hub
          </Link>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-black/10 hover:bg-black/20 rounded px-2 py-0.5 text-xs transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
