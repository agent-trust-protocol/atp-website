import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// One-time endpoint to create the founder account.
// Requires FOUNDER_EMAIL and FOUNDER_SETUP_TOKEN env vars.
// Call once with: POST /api/admin/setup  { "token": "...", "password": "..." }
// After the account exists, repeat calls are safely rejected.
export async function POST(req: NextRequest) {
  const founderEmail = process.env.FOUNDER_EMAIL;
  const setupToken = process.env.FOUNDER_SETUP_TOKEN;

  if (!founderEmail || !setupToken) {
    return NextResponse.json(
      { error: 'FOUNDER_EMAIL and FOUNDER_SETUP_TOKEN must be set in environment variables.' },
      { status: 500 }
    );
  }

  let body: { token?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { token, password, name } = body;

  if (!token || token !== setupToken) {
    return NextResponse.json({ error: 'Invalid setup token.' }, { status: 401 });
  }

  if (!password || password.length < 12) {
    return NextResponse.json(
      { error: 'Password must be at least 12 characters.' },
      { status: 400 }
    );
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: founderEmail,
        password,
        name: name || 'Founder',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Founder account created for ${founderEmail}. You can now log in at /admin/login.`,
    });
  } catch (err: any) {
    const message = err?.message || 'Setup failed.';
    // User already exists — that's fine, treat as success
    if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exists') || message.toLowerCase().includes('duplicate')) {
      return NextResponse.json({
        success: true,
        message: `Account for ${founderEmail} already exists. Log in at /admin/login.`,
      });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
