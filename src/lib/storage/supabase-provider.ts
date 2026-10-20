import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseStorageProvider {
  private client: SupabaseClient | null = null;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.bucketName = process.env.SUPABASE_BUCKET || 'personal-cloud';

    if (supabaseUrl && serviceRoleKey) {
      this.client = createClient(supabaseUrl, serviceRoleKey);
      this.ensureBucket();
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      const { data: buckets } = await this.client.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === this.bucketName);
      if (!exists) {
        await this.client.storage.createBucket(this.bucketName, {
          public: false, // Keep bucket private for personal cloud security!
        });
      }
    } catch {
      // Bucket might already exist or list permissions restricted
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ storageKey: string }> {
    if (!this.client) throw new Error('Supabase client is not configured');

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(storageKey, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return { storageKey };
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    if (!this.client) throw new Error('Supabase client is not configured');

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(storageKey);

    if (error || !data) {
      throw new Error(`Supabase download failed: ${error?.message || 'No data'}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client.storage
      .from(this.bucketName)
      .remove([storageKey]);
    return !error;
  }

  async getSignedUrl(storageKey: string, expiresIn = 3600): Promise<string | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(storageKey, expiresIn);

    if (error || !data) return null;
    return data.signedUrl;
  }

  async getSignedUploadUrl(
    storageKey: string
  ): Promise<{ signedUrl: string; token: string; path: string } | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .createSignedUploadUrl(storageKey);

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
