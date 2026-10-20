import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

export class LocalStorageProvider {
  private baseDir: string;

  constructor() {
    if (process.env.VERCEL) {
      this.baseDir = path.join(os.tmpdir(), 'stark-storage');
    } else {
      this.baseDir = path.join(process.cwd(), 'data', 'storage');
    }
    this.ensureDir();
  }

  private ensureDir() {
    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ storageKey: string }> {
    this.ensureDir();
    const filePath = path.join(this.baseDir, storageKey);
    const parentDir = path.dirname(filePath);
    if (!fsSync.existsSync(parentDir)) {
      await fs.mkdir(parentDir, { recursive: true });
    }
    await fs.writeFile(filePath, fileBuffer);
    return { storageKey };
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, storageKey);
    return await fs.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getDownloadUrl(storageKey: string): Promise<string | null> {
    return `/api/files/download/${encodeURIComponent(storageKey)}`;
  }
}
