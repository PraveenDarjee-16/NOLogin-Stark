import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const note = await db.getNoteById(id);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  return NextResponse.json({ note });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const note = await db.getNoteById(id);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: any = {};

  if (typeof body.title === 'string') {
    updates.title = body.title.trim() || 'Untitled Note';
  }
  if (typeof body.content === 'string') {
    updates.content = body.content;
  }
  if (typeof body.isTrash === 'boolean') {
    updates.isTrash = body.isTrash;
    updates.trashDate = body.isTrash ? new Date().toISOString() : null;
  }
  if (typeof body.isFavorite === 'boolean') {
    updates.isFavorite = body.isFavorite;
  }

  const updated = await db.updateNote(id, updates);
  return NextResponse.json({ success: true, note: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const note = await db.getNoteById(id);
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  await db.deleteNotePermanently(id);
  return NextResponse.json({
    success: true,
    message: 'Note permanently deleted from cloud database',
  });
}
