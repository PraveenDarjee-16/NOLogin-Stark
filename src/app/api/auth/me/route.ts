import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    isAuthenticated: true,
    username: session.username,
    role: session.role,
  });
}
