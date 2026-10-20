import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, verifySessionToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check session either from cookie or query token (for media streaming tags like <img src="..." />)
  let session = await getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token');

  if (!session && tokenParam) {
    session = await verifySessionToken(tokenParam);
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const file = await db.getFileById(id);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const { provider } = getStorageProvider();

    // If cloud provider offers a signed streaming/download URL, redirect directly
    // This allows full CDN video streaming and avoids Vercel 4.5MB serverless response limit
    if (typeof provider.getSignedUrl === 'function') {
      try {
        const signedUrl = await provider.getSignedUrl(file.storageKey, 7200);
        if (signedUrl) {
          return NextResponse.redirect(signedUrl);
        }
      } catch (err) {
        console.warn('Signed URL generation failed, falling back to buffer download', err);
      }
    }

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
    const isPreview = searchParams.get('preview') === 'true';
    const dispositionType = isPreview ? 'inline' : 'attachment';
    const rangeHeader = req.headers.get('range');

    // HTTP 206 Partial Content support for smooth video/audio seeking and playback
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
            'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(
              file.name
            )}"`,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(
          file.name
        )}"`,
        'Content-Length': totalSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
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
