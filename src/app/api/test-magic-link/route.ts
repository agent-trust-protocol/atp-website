import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('\n🧪 TEST: Attempting to send magic link to:', email);

    // Import and use the email service
    const { emailService } = await import('@/lib/email');

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.BETTER_AUTH_URL ??
      'http://localhost:3000';
    const testUrl = new URL('/api/auth/magic-link/verify', baseUrl);
    testUrl.searchParams.set('token', 'test-token');
    testUrl.searchParams.set('callbackURL', '/auth/callback');

    console.log('🔗 Test URL:', testUrl.toString());

    const result = await emailService.sendMagicLinkEmail(email, testUrl.toString());

    if (result) {
      console.log('✅ TEST PASSED: Magic link email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Magic link email sent successfully',
        email
      });
    } else {
      console.log('❌ TEST FAILED: Email service returned false');
      return NextResponse.json(
        { error: 'Failed to send email. Check server logs.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
    return NextResponse.json(
      { error: `Test failed: ${  error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
