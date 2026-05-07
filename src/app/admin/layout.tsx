'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data) {
          router.push('/admin/login');
        } else {
          setAuthenticated(true);
        }
      } catch (err) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Router will handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Yellow Founder Mode Bar */}
      <div className="sticky top-0 z-50 bg-yellow-400 text-gray-900 px-4 py-3 flex items-center justify-between border-b-2 border-yellow-500">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">⚡</span>
          <span>FOUNDER MODE</span>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="text-gray-900 hover:bg-yellow-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
}
