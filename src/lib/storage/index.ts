import { LocalStorageProvider } from './local-provider';
import { SupabaseStorageProvider } from './supabase-provider';
import { S3StorageProvider } from './s3-provider';

export interface StorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ storageKey: string; publicUrl?: string }>;
  downloadFile(storageKey: string): Promise<Buffer>;
  deleteFile(storageKey: string): Promise<boolean>;
  getDownloadUrl?(storageKey: string): Promise<string | null>;
}

let activeProvider: StorageProvider | null = null;
let activeProviderType: 'supabase' | 'r2' | 'local' = 'local';

export function getStorageProvider(): {
  provider: StorageProvider;
  type: 'supabase' | 'r2' | 'local';
} {
  if (activeProvider) {
    return { provider: activeProvider, type: activeProviderType };
  }

  const preferred = process.env.STORAGE_PROVIDER?.toLowerCase();

  // Try Supabase first if configured
  if (preferred === 'supabase' || (!preferred && process.env.SUPABASE_URL)) {
    const supabase = new SupabaseStorageProvider();
    if (supabase.isConfigured()) {
      activeProvider = supabase;
      activeProviderType = 'supabase';
      return { provider: activeProvider, type: activeProviderType };
    }
  }

  // Try Cloudflare R2 / S3
  if (
    preferred === 'r2' ||
    preferred === 's3' ||
    (!preferred && (process.env.S3_ENDPOINT || process.env.R2_ACCOUNT_ID))
  ) {
    const s3 = new S3StorageProvider();
    if (s3.isConfigured()) {
      activeProvider = s3;
      activeProviderType = 'r2';
      return { provider: activeProvider, type: activeProviderType };
    }
  }

  // Fallback to robust Local storage
  activeProvider = new LocalStorageProvider();
  activeProviderType = 'local';
  return { provider: activeProvider, type: activeProviderType };
}
