import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import { getFileCategory, generateId } from '@/lib/utils';
import { CloudFile } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get('folderId');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const favoritesOnly = searchParams.get('favorites') === 'true';
  const trashOnly = searchParams.get('trash') === 'true';
  const recentOnly = searchParams.get('recent') === 'true';

  let files = await db.getFiles();

  if (trashOnly) {
    files = files.filter((f) => f.isTrash);
  } else {
    // Exclude trashed files unless requested
    files = files.filter((f) => !f.isTrash);

    if (favoritesOnly) {
      files = files.filter((f) => f.isFavorite);
    } else if (recentOnly) {
      files = [...files].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (category) {
      files = files.filter((f) => f.category === category);
    } else if (folderId !== null && folderId !== undefined) {
      if (folderId === 'root' || folderId === '') {
        files = files.filter((f) => !f.folderId);
      } else {
        files = files.filter((f) => f.folderId === folderId);
      }
    }
  }

  if (search) {
    const q = search.toLowerCase();
    files = files.filter((f) => f.name.toLowerCase().includes(q));
  }

  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Direct Upload Registration (JSON) for files uploaded straight to Supabase/S3 from browser
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { storageKey, name, size, mimeType, folderId, dataUrl } = body;

      if (!storageKey || !name) {
        return NextResponse.json(
          { error: 'Missing required file details (storageKey, name)' },
          { status: 400 }
        );
      }

      const fileMime = mimeType || 'application/octet-stream';
      const category = getFileCategory(fileMime, name);
      const { type } = getStorageProvider();

      const newFile: CloudFile = {
        id: generateId('file'),
        name,
        size: Number(size) || 0,
        mimeType: fileMime,
        category,
        folderId: folderId === 'root' ? null : folderId,
        storageKey,
        storageProvider: type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
        isTrash: false,
        dataUrl: dataUrl || undefined,
        publicUrl: dataUrl || undefined,
      };

      await db.addFile(newFile);
      return NextResponse.json({ success: true, file: newFile });
    }

    // Standard Multipart FormData upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderId = (formData.get('folderId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedName = file.name.replace(/[^\w.-]/g, '_');
    const storageKey = `${Date.now()}_${sanitizedName}`;
    const mimeType = file.type || 'application/octet-stream';
    const category = getFileCategory(mimeType, file.name);

    const { provider, type } = getStorageProvider();
    const uploadResult = await provider.uploadFile(buffer, storageKey, mimeType);

    // Keep dataUrl for files <= 3.5MB to guarantee persistence across ephemeral Vercel lambdas
    const dataUrl =
      file.size <= 3.5 * 1024 * 1024
        ? `data:${mimeType};base64,${buffer.toString('base64')}`
        : undefined;

    const newFile: CloudFile = {
      id: generateId('file'),
      name: file.name,
      size: file.size,
      mimeType,
      category,
      folderId: folderId === 'root' ? null : folderId,
      storageKey: uploadResult.storageKey,
      storageProvider: type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
      isTrash: false,
      publicUrl: uploadResult.publicUrl || dataUrl,
      dataUrl,
    };

    await db.addFile(newFile);

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
