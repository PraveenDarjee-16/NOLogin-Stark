import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createSessionToken, getAuthCookieConfig } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const isValid = await verifyCredentials(password, username);
    if (!isValid) {
      return NextResponse.json(
        { error: 'ACCESS DENIED: Invalid Security Credentials' },
        { status: 401 }
      );
    }

    const effectiveUsername = username?.trim() || process.env.ADMIN_USERNAME || 'admin';
    const token = await createSessionToken(effectiveUsername);

    const response = NextResponse.json({
      success: true,
      message: 'AUTHENTICATION VERIFIED: Access Granted',
      username: effectiveUsername,
    });

    const cookieConfig = getAuthCookieConfig(token);
    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal security authentication error' },
      { status: 500 }
    );
  }
}
