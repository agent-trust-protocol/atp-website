import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setupToken, email, password, name } = body;

    // Validate setup token
    if (!setupToken || setupToken !== process.env.FOUNDER_SETUP_TOKEN) {
      return Response.json({ error: 'Invalid setup token.' }, { status: 401 });
    }

    // Validate password length
    if (!password || password.length < 12) {
      return Response.json({ error: 'Password must be at least 12 characters.' }, { status: 400 });
    }

    // Try to create the founder account
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || 'Founder',
      },
    });

    // If user already exists, that's okay - idempotent setup
    if ('error' in result && result.error?.message?.includes('already exists')) {
      return Response.json(
        {
          success: true,
          message: `Founder account already exists for ${email}.`,
        },
        { status: 200 }
      );
    }

    if ('error' in result) {
      return Response.json({ error: result.error?.message || 'Failed to create account.' }, { status: 400 });
    }

    return Response.json(
      {
        success: true,
        message: `Founder account created for ${email}.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[admin/setup]', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
