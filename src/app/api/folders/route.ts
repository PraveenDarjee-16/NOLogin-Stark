import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { CloudFolder } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const trashOnly = searchParams.get('trash') === 'true';

  let folders = await db.getFolders(session.username);
  if (trashOnly) {
    folders = folders.filter((f) => f.isTrash);
  } else {
    folders = folders.filter((f) => !f.isTrash);
  }

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, parentId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const newFolder: CloudFolder = {
      id: generateId('folder'),
      name: name.trim(),
      parentId: parentId === 'root' ? null : parentId || null,
      isSystem: false,
      userId: session.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTrash: false,
    };

    await db.addFolder(newFolder);
    return NextResponse.json({ success: true, folder: newFolder });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create folder' },
      { status: 500 }
    );
  }
}
