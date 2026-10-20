import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getStorageProvider } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { filename, mimeType } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const sanitizedName = filename.replace(/[^\w.-]/g, '_');
    const storageKey = `${Date.now()}_${sanitizedName}`;
    const contentType = mimeType || 'application/octet-stream';

    const { provider, type } = getStorageProvider();

    if (
      (type === 'supabase' || type === 'r2') &&
      typeof provider.getSignedUploadUrl === 'function'
    ) {
      const uploadInfo = await provider.getSignedUploadUrl(storageKey, contentType);
      if (uploadInfo) {
        return NextResponse.json({
          success: true,
          provider: type,
          storageKey,
          uploadUrl: uploadInfo.signedUrl,
          token: (uploadInfo as any).token,
          path: (uploadInfo as any).path,
          uploadMethod: 'PUT',
        });
      }
    }

    // If local or signed upload URL not available
    return NextResponse.json({
      success: false,
      provider: type,
      storageKey,
      message: 'Direct upload URL not supported on this provider; use standard form-data or local client storage',
    });
  } catch (error: any) {
    console.error('Presigned upload URL generation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
