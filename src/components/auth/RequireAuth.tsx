'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useMe } from '@/hooks/use-me';

interface RequireAuthProps {
  children: React.ReactNode;
  tier?: 'startup' | 'professional' | 'enterprise';
  feature?: string;
}

export function RequireAuth({ children, tier = 'startup', feature }: RequireAuthProps) {
  const me = useMe();
  const router = useRouter();
  const isLoading = me.loading;
  // Founder bypasses every gate so the live product can be QA'd end-to-end.
  const isAuthenticated = me.authenticated || me.isFounder;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access {feature ? `the ${feature}` : 'this feature'}.
              {tier !== 'startup' && (
                <span className="block mt-2">
                  This feature requires a <strong className="capitalize">{tier}</strong> subscription.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}&feature=${feature || 'premium'}&tier=${tier}`)}
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/signup')}
              className="w-full"
            >
              Create Account
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
