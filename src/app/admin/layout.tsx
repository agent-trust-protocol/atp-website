import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <Link
          href="/api/auth/sign-out"
          className="bg-black/10 hover:bg-black/20 rounded px-2 py-0.5 text-xs transition-colors"
        >
          Sign out
        </Link>
      </div>
      {children}
    </div>
  );
}
