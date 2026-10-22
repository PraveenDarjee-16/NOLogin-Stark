import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { CloudNote } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const trashOnly = searchParams.get('trash') === 'true';

  let notes = await db.getNotes(session.username);

  if (trashOnly) {
    notes = notes.filter((n) => n.isTrash);
  } else {
    notes = notes.filter((n) => !n.isTrash);
  }

  if (search) {
    const q = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  // Sort by updatedAt descending
  notes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = (body.title || 'Untitled Note').trim();
    const content = typeof body.content === 'string' ? body.content : '';

    const newNote: CloudNote = {
      id: generateId('note'),
      title,
      content,
      userId: session.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTrash: false,
    };

    await db.addNote(newNote);
    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}
