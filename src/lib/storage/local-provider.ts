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

  getBaseDir(): string {
    return this.baseDir;
  }

  getFilePath(storageKey: string): string {
    // Sanitize path traversal
    const safeKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.baseDir, safeKey);
  }

  fileExists(storageKey: string): boolean {
    try {
      const filePath = this.getFilePath(storageKey);
      return fsSync.existsSync(filePath);
    } catch {
      return false;
    }
  }

  getFileStat(storageKey: string): fsSync.Stats | null {
    try {
      const filePath = this.getFilePath(storageKey);
      if (fsSync.existsSync(filePath)) {
        return fsSync.statSync(filePath);
      }
      return null;
    } catch {
      return null;
    }
  }

  createReadStream(
    storageKey: string,
    options?: { start?: number; end?: number }
  ): fsSync.ReadStream | null {
    try {
      const filePath = this.getFilePath(storageKey);
      if (!fsSync.existsSync(filePath)) return null;
      return fsSync.createReadStream(filePath, options);
    } catch {
      return null;
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<{ storageKey: string }> {
    this.ensureDir();
    const filePath = this.getFilePath(storageKey);
    const parentDir = path.dirname(filePath);
    if (!fsSync.existsSync(parentDir)) {
      await fs.mkdir(parentDir, { recursive: true });
    }
    await fs.writeFile(filePath, fileBuffer);
    return { storageKey };
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    const filePath = this.getFilePath(storageKey);
    return await fs.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(storageKey);
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

  listStorageFiles(): Array<{ key: string; size: number; mtime: Date }> {
    try {
      this.ensureDir();
      const entries = fsSync.readdirSync(this.baseDir, { withFileTypes: true });
      const results: Array<{ key: string; size: number; mtime: Date }> = [];
      for (const entry of entries) {
        if (entry.isFile()) {
          try {
            const fullPath = path.join(this.baseDir, entry.name);
            const stat = fsSync.statSync(fullPath);
            results.push({
              key: entry.name,
              size: stat.size,
              mtime: stat.mtime,
            });
          } catch {}
        }
      }
      return results;
    } catch {
      return [];
    }
  }
}
