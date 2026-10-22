import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import { CloudFile, CloudFolder } from '@/lib/types';

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

  if (folder.userId && folder.userId.toLowerCase() !== session.username.toLowerCase()) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  try {
    const allFolders = await db.getFolders(session.username);
    const allFiles = await db.getFiles(session.username);
    const { provider } = getStorageProvider();

    const zip = new JSZip();

    // Helper to recursively collect files and folders
    async function collectFolder(currentFolderId: string, currentZipFolder: JSZip) {
      // Add files in current folder
      const folderFiles = allFiles.filter(
        (f) => f.folderId === currentFolderId && !f.isTrash
      );
      for (const file of folderFiles) {
        try {
          const buffer = await provider.downloadFile(file.storageKey);
          currentZipFolder.file(file.name, buffer);
        } catch (e) {
          console.error(`Failed to include file ${file.name} in ZIP:`, e);
        }
      }

      // Add child folders
      const childFolders = allFolders.filter(
        (f) => f.parentId === currentFolderId && !f.isTrash
      );
      for (const child of childFolders) {
        const subZip = currentZipFolder.folder(child.name);
        if (subZip) {
          await collectFolder(child.id, subZip);
        }
      }
    }

    await collectFolder(folder.id, zip);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const safeFilename = `${folder.name.replace(/[^\w.-]/g, '_')}.zip`;

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          safeFilename
        )}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Folder zip error:', error);
    return NextResponse.json(
      { error: 'Failed to generate folder ZIP archive' },
      { status: 500 }
    );
  }
}
