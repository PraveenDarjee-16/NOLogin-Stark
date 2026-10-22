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

  const { id } = await params;
  const folder = await db.getFolderById(id);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  return NextResponse.json({ folder });
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
  const folder = await db.getFolderById(id);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  if (folder.isSystem) {
    return NextResponse.json(
      { error: 'System folders cannot be modified' },
      { status: 403 }
    );
  }

  if (folder.userId && folder.userId.toLowerCase() !== session.username.toLowerCase()) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: any = {};

  if (typeof body.name === 'string' && body.name.trim().length > 0) {
    updates.name = body.name.trim();
  }
  if ('parentId' in body) {
    // Avoid circular nesting
    if (body.parentId === id) {
      return NextResponse.json(
        { error: 'Folder cannot be its own parent' },
        { status: 400 }
      );
    }
    updates.parentId = body.parentId === 'root' ? null : body.parentId;
  }
  if (typeof body.isTrash === 'boolean') {
    updates.isTrash = body.isTrash;
  }

  const updated = await db.updateFolder(id, updates);
  return NextResponse.json({ success: true, folder: updated });
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
  const folder = await db.getFolderById(id);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  if (folder.isSystem) {
    return NextResponse.json(
      { error: 'System folders cannot be deleted' },
      { status: 403 }
    );
  }

  if (folder.userId && folder.userId.toLowerCase() !== session.username.toLowerCase()) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  // Delete all files inside this folder recursively
  const allFiles = await db.getFiles(session.username);
  const filesToDelete = allFiles.filter((f) => f.folderId === id);
  const { provider } = getStorageProvider();

  for (const f of filesToDelete) {
    await provider.deleteFile(f.storageKey);
    await db.deleteFilePermanently(f.id);
  }

  // Permanently delete the folder
  await db.deleteFolderPermanently(id);

  return NextResponse.json({
    success: true,
    message: 'Folder and contents permanently deleted',
  });
}
