import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageProvider {
  private client: S3Client | null = null;
  private bucketName: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION || 'auto';
    this.bucketName = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'personal-cloud';

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async uploadFile(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ storageKey: string }> {
    if (!this.client) throw new Error('S3/R2 client is not configured');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await this.client.send(command);
    return { storageKey };
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    if (!this.client) throw new Error('S3/R2 client is not configured');

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.client.send(command);
    if (!response.Body) throw new Error('File body empty from S3/R2');

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(storageKey: string, expiresIn = 3600): Promise<string | null> {
    if (!this.client) return null;
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch {
      return null;
    }
  }

  async getSignedUploadUrl(
    storageKey: string,
    mimeType = 'application/octet-stream',
    expiresIn = 3600
  ): Promise<{ signedUrl: string } | null> {
    if (!this.client) return null;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: mimeType,
      });
      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return { signedUrl };
    } catch {
      return null;
    }
  }

  getClient(): S3Client | null {
    return this.client;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
