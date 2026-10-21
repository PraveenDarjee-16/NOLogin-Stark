import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserPreferences } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const preferences = await db.getPreferences(session.username);
  return NextResponse.json({ preferences });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<UserPreferences>;
    const updated = await db.updatePreferences(session.username, body);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
