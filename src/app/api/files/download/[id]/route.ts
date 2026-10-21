import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, verifySessionToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import fsSync from 'fs';
import { Readable } from 'stream';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check session either from cookie or query token (for media streaming tags like <video src="..." /> or <img src="..." />)
  let session = await getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token');

  if (!session && tokenParam) {
    session = await verifySessionToken(tokenParam);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  // Look up file by ID or storage key, enforcing user permissions
  let file = await db.getFileById(id, session.username);
  if (!file) {
    file = await db.getFileByStorageKey(id, session.username);
  }
  if (!file) {
    // If id has local_ prefix, strip it
    const cleanId = id.replace(/^local_/, '');
    file = await db.getFileById(cleanId, session.username);
  }

  if (!file) {
    return NextResponse.json({ error: 'File not found in Stark Cloud archive' }, { status: 404 });
  }

  const isPreview = searchParams.get('preview') === 'true';
  const dispositionType = isPreview ? 'inline' : 'attachment';

  // Standard RFC 5987 / RFC 6266 filename encoding
  const asciiFilename = file.name.replace(/[^\x20-\x7E]/g, '_');
  const encodedFilename = encodeURIComponent(file.name);
  const contentDisposition = `${dispositionType}; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;

  try {
    const { provider } = getStorageProvider();

    // 1. If cloud provider offers a signed streaming/download URL, redirect directly
    if (typeof provider.getSignedUrl === 'function') {
      try {
        const signedUrl = await provider.getSignedUrl(
          file.storageKey,
          7200,
          isPreview ? undefined : file.name
        );
        if (signedUrl) {
          return NextResponse.redirect(signedUrl, 307);
        }
      } catch (err) {
        console.warn('Signed URL generation failed, falling back to direct stream:', err);
      }
    }

    // 2. High-performance streaming for LocalStorageProvider (bypasses Buffer memory overhead)
    if (typeof (provider as any).getFilePath === 'function') {
      const filePath = (provider as any).getFilePath(file.storageKey);
      if (fsSync.existsSync(filePath)) {
        const stat = fsSync.statSync(filePath);
        const totalSize = stat.size;
        const rangeHeader = req.headers.get('range');

        // HTTP 206 Partial Content support for smooth video/audio seeking and progressive buffering
        if (rangeHeader && rangeHeader.startsWith('bytes=')) {
          const parts = rangeHeader.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

          if (!isNaN(start) && start < totalSize) {
            const chunkEnd = Math.min(end, totalSize - 1);
            const chunkSize = chunkEnd - start + 1;

            const nodeStream = fsSync.createReadStream(filePath, {
              start,
              end: chunkEnd,
            });
            const webStream = Readable.toWeb(nodeStream);

            return new NextResponse(webStream as any, {
              status: 206,
              headers: {
                'Content-Type': file.mimeType || 'application/octet-stream',
                'Content-Range': `bytes ${start}-${chunkEnd}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize.toString(),
                'Content-Disposition': contentDisposition,
                'Cache-Control': 'private, no-cache, no-transform',
              },
            });
          }
        }

        // Full file stream (200 OK) with Accept-Ranges
        const nodeStream = fsSync.createReadStream(filePath);
        const webStream = Readable.toWeb(nodeStream);

        return new NextResponse(webStream as any, {
          status: 200,
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Length': totalSize.toString(),
            'Content-Disposition': contentDisposition,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, no-cache, no-transform',
          },
        });
      }
    }

    // 3. Fallback: Buffer download from provider or dataUrl
    let buffer: Buffer | null = null;
    try {
      buffer = await provider.downloadFile(file.storageKey);
    } catch (err) {
      if (file.dataUrl) {
        const commaIdx = file.dataUrl.indexOf(',');
        const base64Data = commaIdx >= 0 ? file.dataUrl.substring(commaIdx + 1) : file.dataUrl;
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        throw err;
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: 'Failed to retrieve file from storage engine' },
        { status: 500 }
      );
    }

    const totalSize = buffer.length;
    const rangeHeader = req.headers.get('range');

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && start < totalSize) {
        const chunkEnd = Math.min(end, totalSize - 1);
        const chunk = buffer.subarray(start, chunkEnd + 1);

        return new NextResponse(chunk as any, {
          status: 206,
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Range': `bytes ${start}-${chunkEnd}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunk.length.toString(),
            'Content-Disposition': contentDisposition,
            'Cache-Control': 'private, no-cache, no-transform',
          },
        });
      }
    }

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': contentDisposition,
        'Content-Length': totalSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache, no-transform',
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file from storage engine' },
      { status: 500 }
    );
  }
}
