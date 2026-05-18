'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

function getSafeReturnTo(returnTo: string | null) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/portal';
  }

  return returnTo;
}

const magicLinkErrors: Record<string, string> = {
  INVALID_TOKEN: 'This magic link is invalid or has already been used. Please request a new link.',
  EXPIRED_TOKEN: 'This magic link has expired. Please request a new link.',
  ATTEMPTS_EXCEEDED: 'This magic link has already been used. Please request a new link.',
  failed_to_create_user: 'We could not create your account. Please try again or contact support.',
  failed_to_create_session: 'We could not create your session. Please try again.',
  new_user_signup_disabled: 'New account creation is disabled for this email.'
};

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Magic links should reach this page only after Better Auth verifies
        // /api/auth/magic-link/verify and sets the session cookie.

        // Check for error param (OAuth failures)
        const error = searchParams?.get('error');
        if (error) {
          setStatus('error');
          setMessage(
            magicLinkErrors[error] ?? `Authentication failed: ${error}. Please try again.`
          );
          return;
        }

        // Poll for session (may take a moment for cookie to propagate)
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 800));

          const sessionResponse = await fetch('/api/auth/get-session', {
            credentials: 'include'
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.session) {
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');

              const returnTo = getSafeReturnTo(searchParams?.get('returnTo') ?? null);
              setTimeout(() => {
                router.push(returnTo);
              }, 1000);
              return;
            }
          }

          attempts++;
        }

        // If we get here after all attempts, authentication likely failed
        setStatus('error');
        setMessage('Unable to verify your session. The link may have expired or already been used.');
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'processing' && (
            <>
              <CardTitle className="text-2xl font-bold">Signing In...</CardTitle>
              <CardDescription>Verifying your magic link</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                Welcome Back!
              </CardTitle>
              <CardDescription>Authentication successful</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                Authentication Failed
              </CardTitle>
              <CardDescription>Unable to sign in</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'processing' && (
            <div className="flex justify-center">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Common reasons for failure:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Magic link has expired (15 minute window)</li>
                  <li>Link has already been used</li>
                  <li>Token is invalid or corrupted</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4">
                <a href="/login" className="block">
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                    Request New Magic Link
                  </button>
                </a>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Don't close this window while we process your authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
