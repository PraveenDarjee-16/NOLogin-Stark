import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const file = await db.getFileById(id, session.username);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ file });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const body = await req.json();
  const file = await db.getFileById(id, session.username);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const updates: any = {};
  if (typeof body.name === 'string' && body.name.trim().length > 0) {
    updates.name = body.name.trim();
  }
  if ('folderId' in body) {
    updates.folderId = body.folderId === 'root' ? null : body.folderId;
  }
  if (typeof body.isFavorite === 'boolean') {
    updates.isFavorite = body.isFavorite;
  }
  if (typeof body.isTrash === 'boolean') {
    updates.isTrash = body.isTrash;
    updates.trashDate = body.isTrash ? new Date().toISOString() : null;
  }

  const updated = await db.updateFile(id, updates, session.username);
  return NextResponse.json({ success: true, file: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const file = await db.getFileById(id, session.username);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Delete from storage provider
  const { provider } = getStorageProvider();
  await provider.deleteFile(file.storageKey);

  // Delete from database
  await db.deleteFilePermanently(id, session.username);

  return NextResponse.json({ success: true, message: 'File permanently deleted' });
}
