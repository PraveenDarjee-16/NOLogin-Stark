import { NextResponse } from 'next/server';
import { getClearAuthCookieConfig } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'TERMINAL DEACTIVATED: Logged out successfully',
  });
  const clearCookie = getClearAuthCookieConfig();
  response.cookies.set(clearCookie.name, clearCookie.value, clearCookie);
  return response;
}
