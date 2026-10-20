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

    const buffer = await provider.downloadFile(file.storageKey);

    const isPreview = searchParams.get('preview') === 'true';
    const dispositionType = isPreview ? 'inline' : 'attachment';

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(
          file.name
        )}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
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
