import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { CloudFile, CloudFolder, CloudNote, UserPreferences } from './types';
import { getFileCategory, getMimeTypeFromFilename, generateId } from './utils';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface DatabaseSchema {
  files: CloudFile[];
  folders: CloudFolder[];
  notes: CloudNote[];
  preferences: UserPreferences;
  userPreferences?: Record<string, UserPreferences>;
  version: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'jarvis-cyan',
  wallpaperType: 'spiderman-city',
  wallpaperBrightness: 0.85,
  hologramOpacity: 65,
  hologramAmount: 75,
  storageCapacityGB: 15,
  desktopLayout: 'grid',
};

const SYSTEM_FOLDERS: CloudFolder[] = [
  {
    id: 'system-documents',
    name: 'Documents',
    parentId: null,
    isSystem: true,
    systemType: 'documents',
    icon: 'file-text',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-photos',
    name: 'Photos',
    parentId: null,
    isSystem: true,
    systemType: 'photos',
    icon: 'image',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-videos',
    name: 'Videos',
    parentId: null,
    isSystem: true,
    systemType: 'videos',
    icon: 'film',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-music',
    name: 'Music',
    parentId: null,
    isSystem: true,
    systemType: 'music',
    icon: 'music',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-downloads',
    name: 'Downloads',
    parentId: null,
    isSystem: true,
    systemType: 'downloads',
    icon: 'download',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-other',
    name: 'Other Files',
    parentId: null,
    isSystem: true,
    systemType: 'other',
    icon: 'archive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-recent',
    name: 'Recently Uploaded',
    parentId: null,
    isSystem: true,
    systemType: 'recent',
    icon: 'clock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-favorites',
    name: 'Favourites',
    parentId: null,
    isSystem: true,
    systemType: 'favorites',
    icon: 'star',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'system-trash',
    name: 'Trash',
    parentId: null,
    isSystem: true,
    systemType: 'trash',
    icon: 'trash-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class Database {
  private dbPath: string;
  private storageDir: string;
  private memoryCache: DatabaseSchema | null = null;
  private lastLoadTime = 0;
  private readonly CACHE_TTL_MS = 2000;
  private isSaving = false;
  private supabaseClient: SupabaseClient | null = null;
  private supabaseBucket: string = 'personal-cloud';
  private s3Client: S3Client | null = null;
  private s3Bucket: string = 'personal-cloud';

  constructor() {
    if (process.env.VERCEL) {
      this.dbPath = path.join(os.tmpdir(), 'database.json');
      this.storageDir = path.join(os.tmpdir(), 'stark-storage');
    } else {
      this.dbPath = path.join(process.cwd(), 'data', 'database.json');
      this.storageDir = path.join(process.cwd(), 'data', 'storage');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.supabaseBucket = process.env.SUPABASE_BUCKET || 'personal-cloud';

    if (supabaseUrl && serviceRoleKey) {
      try {
        this.supabaseClient = createClient(supabaseUrl, serviceRoleKey);
      } catch (err) {
        console.warn('Supabase DB sync client initialization failed:', err);
      }
    }

    const s3Endpoint = process.env.S3_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
    const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const s3Region = process.env.S3_REGION || 'auto';
    this.s3Bucket = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'personal-cloud';

    if (s3Endpoint && s3AccessKeyId && s3SecretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: s3Region,
          endpoint: s3Endpoint,
          credentials: {
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretAccessKey,
          },
        });
      } catch (err) {
        console.warn('S3 DB sync client initialization failed:', err);
      }
    }
  }

  /**
   * Automatically scans storage disk directory for any existing files that are not
   * yet recorded in the database schema. This guarantees persistent recovery of
   * large videos (like amazing-spider.mp4) or previously uploaded files.
   */
  private syncStorageDirectory(schema: DatabaseSchema): boolean {
    let modified = false;
    try {
      if (!fsSync.existsSync(this.storageDir)) {
        return false;
      }

      const entries = fsSync.readdirSync(this.storageDir, { withFileTypes: true });
      const existingStorageKeys = new Set(schema.files.map((f) => f.storageKey));
      const existingNames = new Set(schema.files.map((f) => f.name.toLowerCase()));

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const storageKey = entry.name;

        // Skip internal/hidden files
        if (storageKey.startsWith('.') || storageKey.startsWith('_')) continue;

        if (!existingStorageKeys.has(storageKey)) {
          try {
            const filePath = path.join(this.storageDir, storageKey);
            const stat = fsSync.statSync(filePath);
            if (stat.size <= 0) continue;

            // Extract human-readable filename by removing leading timestamp prefix if present
            const cleanName = storageKey.replace(/^\d+_/, '') || storageKey;

            // Don't duplicate if file with exact name and size is already registered
            const alreadyExists = schema.files.some(
              (f) => f.name.toLowerCase() === cleanName.toLowerCase() && f.size === stat.size
            );
            if (alreadyExists) continue;

            const mimeType = getMimeTypeFromFilename(cleanName);
            const category = getFileCategory(mimeType, cleanName);

            const recoveredFile: CloudFile = {
              id: `file_${storageKey.replace(/[^\w.-]/g, '_')}`,
              name: cleanName,
              size: stat.size,
              mimeType,
              category,
              folderId: null,
              storageKey,
              storageProvider: 'local',
              createdAt: stat.birthtime?.toISOString() || stat.mtime.toISOString(),
              updatedAt: stat.mtime.toISOString(),
              userId: 'admin',
              isFavorite: false,
              isTrash: false,
            };

            schema.files.push(recoveredFile);
            existingStorageKeys.add(storageKey);
            existingNames.add(cleanName.toLowerCase());
            modified = true;
          } catch (entryErr) {
            console.warn('Could not inspect storage file for recovery:', storageKey, entryErr);
          }
        }
      }
    } catch (err) {
      console.warn('Storage directory auto-sync notice:', err);
    }
    return modified;
  }

  private async load(force = false): Promise<DatabaseSchema> {
    const now = Date.now();
    if (this.memoryCache && !force && now - this.lastLoadTime < this.CACHE_TTL_MS) {
      return this.memoryCache;
    }

    // 1. If Supabase Storage is configured, prioritize reading from cloud bucket
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from(this.supabaseBucket)
          .download('_system/database.json');

        if (data && !error) {
          const raw = await data.text();
          const parsed: DatabaseSchema = JSON.parse(raw);
          const folderIds = new Set(parsed.folders?.map((f: CloudFolder) => f.id) || []);
          parsed.folders = parsed.folders || [];
          for (const sys of SYSTEM_FOLDERS) {
            if (!folderIds.has(sys.id)) {
              parsed.folders.push(sys);
            }
          }
          parsed.files = parsed.files || [];
          parsed.notes = parsed.notes || [];
          parsed.preferences = parsed.preferences || { ...DEFAULT_PREFERENCES };
          parsed.userPreferences = parsed.userPreferences || {};

          const modified = this.syncStorageDirectory(parsed);
          this.memoryCache = parsed;
          this.lastLoadTime = Date.now();
          if (modified) {
            await this.persist();
          }
          return parsed;
        }
      } catch (cloudErr) {
        console.warn('Could not read database.json from Supabase, checking local/seed:', cloudErr);
      }
    }

    // 1b. If S3/R2 Storage is configured, read from cloud bucket
    if (!this.supabaseClient && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.s3Bucket,
          Key: '_system/database.json',
        });
        const res = await this.s3Client.send(command);
        if (res.Body) {
          const raw = await res.Body.transformToString();
          const parsed: DatabaseSchema = JSON.parse(raw);
          const folderIds = new Set(parsed.folders?.map((f: CloudFolder) => f.id) || []);
          parsed.folders = parsed.folders || [];
          for (const sys of SYSTEM_FOLDERS) {
            if (!folderIds.has(sys.id)) {
              parsed.folders.push(sys);
            }
          }
          parsed.files = parsed.files || [];
          parsed.notes = parsed.notes || [];
          parsed.preferences = parsed.preferences || { ...DEFAULT_PREFERENCES };
          parsed.userPreferences = parsed.userPreferences || {};

          const modified = this.syncStorageDirectory(parsed);
          this.memoryCache = parsed;
          this.lastLoadTime = Date.now();
          if (modified) {
            await this.persist();
          }
          return parsed;
        }
      } catch (s3Err) {
        console.warn('Could not read database.json from S3, checking local/seed:', s3Err);
      }
    }

    try {
      // If on Vercel and /tmp/database.json doesn't exist yet, seed from project data/database.json
      if (process.env.VERCEL && !fsSync.existsSync(this.dbPath)) {
        const seedPath = path.join(process.cwd(), 'data', 'database.json');
        if (fsSync.existsSync(seedPath)) {
          try {
            const rawSeed = await fs.readFile(seedPath, 'utf-8');
            await fs.writeFile(this.dbPath, rawSeed, 'utf-8');
          } catch {}
        }
      }

      if (fsSync.existsSync(this.dbPath)) {
        const raw = await fs.readFile(this.dbPath, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        // Ensure system folders are present
        const folderIds = new Set(data.folders?.map((f: CloudFolder) => f.id) || []);
        data.folders = data.folders || [];
        for (const sys of SYSTEM_FOLDERS) {
          if (!folderIds.has(sys.id)) {
            data.folders.push(sys);
          }
        }
        data.files = data.files || [];
        data.notes = data.notes || [];
        data.preferences = data.preferences || { ...DEFAULT_PREFERENCES };
        data.userPreferences = data.userPreferences || {};

        const modified = this.syncStorageDirectory(data);
        this.memoryCache = data;
        this.lastLoadTime = Date.now();
        if (modified) {
          await this.persist();
        }
        return data;
      }
    } catch (e) {
      console.warn('Failed to read db file, initializing fresh database', e);
    }

    const initial: DatabaseSchema = {
      files: [],
      folders: [...SYSTEM_FOLDERS],
      notes: [],
      preferences: { ...DEFAULT_PREFERENCES },
      userPreferences: {
        admin: { ...DEFAULT_PREFERENCES },
      },
      version: 1,
    };

    this.syncStorageDirectory(initial);
    this.memoryCache = initial;
    this.lastLoadTime = Date.now();
    await this.persist();
    return initial;
  }

  private async persist(): Promise<void> {
    if (!this.memoryCache || this.isSaving) return;
    this.isSaving = true;
    this.lastLoadTime = Date.now();
    try {
      const payloadString = JSON.stringify(this.memoryCache, null, 2);

      // Local / /tmp write
      const dir = path.dirname(this.dbPath);
      if (!fsSync.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }
      await fs.writeFile(this.dbPath, payloadString, 'utf-8');

      // Cloud Supabase write (persists across all Vercel Serverless instances!)
      if (this.supabaseClient) {
        try {
          await this.supabaseClient.storage
            .from(this.supabaseBucket)
            .upload('_system/database.json', Buffer.from(payloadString), {
              contentType: 'application/json',
              upsert: true,
            });
        } catch (cloudSaveErr) {
          console.error('Failed to sync database to Supabase cloud storage:', cloudSaveErr);
        }
      }

      // Cloud S3 / R2 write (persists across all Vercel Serverless instances!)
      if (this.s3Client) {
        try {
          const command = new PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: '_system/database.json',
            Body: Buffer.from(payloadString),
            ContentType: 'application/json',
          });
          await this.s3Client.send(command);
        } catch (s3SaveErr) {
          console.error('Failed to sync database to S3 cloud storage:', s3SaveErr);
        }
      }
    } catch (err) {
      console.error('Error saving database:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Files ---
  async getFiles(username?: string): Promise<CloudFile[]> {
    const db = await this.load();
    if (!username) {
      return [];
    }
    const u = username.toLowerCase();
    // Return files owned by user. If legacy file has no userId, only admin can access it.
    return db.files.filter((f) => {
      const owner = f.userId ? f.userId.toLowerCase() : 'admin';
      return owner === u;
    });
  }

  async getFileById(id: string, username?: string): Promise<CloudFile | null> {
    const db = await this.load();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');
    const file =
      db.files.find(
        (f) =>
          f.id === id ||
          f.id === cleanId ||
          f.storageKey === id ||
          f.storageKey === cleanId ||
          `local_${f.id}` === id ||
          `local_${f.storageKey}` === id
      ) || null;

    if (!file) return null;
    if (username) {
      const u = username.toLowerCase();
      const owner = file.userId ? file.userId.toLowerCase() : 'admin';
      if (owner !== u) {
        return null;
      }
    }
    return file;
  }

  async getFileByStorageKey(key: string, username?: string): Promise<CloudFile | null> {
    const db = await this.load();
    const cleanKey = key.replace(/^local_/, '');
    const file =
      db.files.find(
        (f) =>
          f.storageKey === key ||
          f.storageKey === cleanKey ||
          f.id === key ||
          f.id === cleanKey
      ) || null;

    if (!file) return null;
    if (username) {
      const u = username.toLowerCase();
      const owner = file.userId ? file.userId.toLowerCase() : 'admin';
      if (owner !== u) {
        return null;
      }
    }
    return file;
  }

  async addFile(file: CloudFile): Promise<CloudFile> {
    const db = await this.load();
    const u = file.userId ? file.userId.toLowerCase() : 'admin';
    // Avoid creating duplicate database entries
    const existingIdx = db.files.findIndex((f) => {
      const fOwner = f.userId ? f.userId.toLowerCase() : 'admin';
      if (f.id === file.id) return true;
      if (f.storageKey === file.storageKey && f.storageKey !== '') return true;
      if (
        f.name.toLowerCase() === file.name.toLowerCase() &&
        f.folderId === file.folderId &&
        fOwner === u
      ) {
        return true;
      }
      return false;
    });

    if (existingIdx >= 0) {
      db.files[existingIdx] = {
        ...db.files[existingIdx],
        ...file,
        updatedAt: new Date().toISOString(),
      };
      await this.persist();
      return db.files[existingIdx];
    }

    db.files.push(file);
    await this.persist();
    return file;
  }

  async updateFile(
    id: string,
    updates: Partial<CloudFile>,
    username?: string
  ): Promise<CloudFile | null> {
    const db = await this.load();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');
    const idx = db.files.findIndex(
      (f) =>
        f.id === id ||
        f.id === cleanId ||
        f.storageKey === id ||
        f.storageKey === cleanId
    );
    if (idx === -1) return null;

    const file = db.files[idx];
    if (username) {
      const u = username.toLowerCase();
      const owner = file.userId ? file.userId.toLowerCase() : 'admin';
      if (owner !== u) {
        return null;
      }
    }

    db.files[idx] = {
      ...file,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return db.files[idx];
  }

  async deleteFilePermanently(id: string, username?: string): Promise<boolean> {
    const db = await this.load();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');
    const file = db.files.find(
      (f) =>
        f.id === id ||
        f.id === cleanId ||
        f.storageKey === id ||
        f.storageKey === cleanId
    );
    if (!file) return false;

    if (username) {
      const u = username.toLowerCase();
      const owner = file.userId ? file.userId.toLowerCase() : 'admin';
      if (owner !== u) {
        return false;
      }
    }

    db.files = db.files.filter((f) => f.id !== file.id);
    await this.persist();
    return true;
  }

  // --- Folders ---
  async getFolders(username?: string): Promise<CloudFolder[]> {
    const db = await this.load();
    if (!username) {
      return db.folders.filter((f) => f.isSystem);
    }
    const u = username.toLowerCase();
    return db.folders.filter((f) => {
      if (f.isSystem) return true;
      const owner = f.userId ? f.userId.toLowerCase() : 'admin';
      return owner === u;
    });
  }

  async getFolderById(id: string): Promise<CloudFolder | null> {
    const db = await this.load();
    return db.folders.find((f) => f.id === id) || null;
  }

  async addFolder(folder: CloudFolder): Promise<CloudFolder> {
    const db = await this.load();
    db.folders.push(folder);
    await this.persist();
    return folder;
  }

  async updateFolder(
    id: string,
    updates: Partial<CloudFolder>
  ): Promise<CloudFolder | null> {
    const db = await this.load();
    const idx = db.folders.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    db.folders[idx] = {
      ...db.folders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return db.folders[idx];
  }

  async deleteFolderPermanently(id: string): Promise<boolean> {
    const db = await this.load();
    const prevLen = db.folders.length;
    db.folders = db.folders.filter((f) => f.id !== id);
    if (db.folders.length !== prevLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Notes (Text Saver) ---
  async getNotes(username?: string): Promise<CloudNote[]> {
    const db = await this.load();
    const notes = db.notes || [];
    if (!username) return [];
    const u = username.toLowerCase();
    return notes.filter((n) => {
      const owner = n.userId ? n.userId.toLowerCase() : 'admin';
      return owner === u;
    });
  }

  async getNoteById(id: string, username?: string): Promise<CloudNote | null> {
    const db = await this.load();
    const note = db.notes?.find((n) => n.id === id) || null;
    if (!note) return null;
    if (username) {
      const u = username.toLowerCase();
      const owner = note.userId ? note.userId.toLowerCase() : 'admin';
      if (owner !== u) return null;
    }
    return note;
  }

  async addNote(note: CloudNote): Promise<CloudNote> {
    const db = await this.load();
    db.notes = db.notes || [];
    db.notes.push(note);
    await this.persist();
    return note;
  }

  async updateNote(
    id: string,
    updates: Partial<CloudNote>,
    username?: string
  ): Promise<CloudNote | null> {
    const db = await this.load();
    db.notes = db.notes || [];
    const idx = db.notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    const note = db.notes[idx];
    if (username) {
      const u = username.toLowerCase();
      const owner = note.userId ? note.userId.toLowerCase() : 'admin';
      if (owner !== u) return null;
    }

    db.notes[idx] = {
      ...note,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return db.notes[idx];
  }

  async deleteNotePermanently(id: string, username?: string): Promise<boolean> {
    const db = await this.load();
    db.notes = db.notes || [];
    const idx = db.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;

    const note = db.notes[idx];
    if (username) {
      const u = username.toLowerCase();
      const owner = note.userId ? note.userId.toLowerCase() : 'admin';
      if (owner !== u) return false;
    }

    db.notes.splice(idx, 1);
    await this.persist();
    return true;
  }

  // --- Preferences (Per-user persistent isolation) ---
  async getPreferences(username?: string): Promise<UserPreferences> {
    const db = await this.load();
    const u = username?.trim().toLowerCase();
    if (u && db.userPreferences && db.userPreferences[u]) {
      const p = db.userPreferences[u];
      return {
        ...DEFAULT_PREFERENCES,
        ...p,
        wallpaperBrightness:
          typeof p.wallpaperBrightness === 'number' && !isNaN(p.wallpaperBrightness)
            ? p.wallpaperBrightness
            : DEFAULT_PREFERENCES.wallpaperBrightness,
        updatedAt: p.updatedAt || Date.now(),
        version: p.version || 1,
      };
    }
    const globalPrefs = db.preferences || DEFAULT_PREFERENCES;
    return {
      ...DEFAULT_PREFERENCES,
      ...globalPrefs,
      wallpaperBrightness:
        typeof globalPrefs.wallpaperBrightness === 'number' && !isNaN(globalPrefs.wallpaperBrightness)
          ? globalPrefs.wallpaperBrightness
          : DEFAULT_PREFERENCES.wallpaperBrightness,
      updatedAt: globalPrefs.updatedAt || Date.now(),
      version: globalPrefs.version || 1,
    };
  }

  async updatePreferences(
    username: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const db = await this.load();
    const u = (username || 'admin').trim().toLowerCase();
    db.userPreferences = db.userPreferences || {};

    const current =
      db.userPreferences[u] || db.preferences || { ...DEFAULT_PREFERENCES };

    // Validate and sanitize numeric fields
    const sanitizedUpdates: Partial<UserPreferences> = { ...updates };
    if (sanitizedUpdates.wallpaperBrightness !== undefined) {
      const b = Number(sanitizedUpdates.wallpaperBrightness);
      if (!isNaN(b)) {
        sanitizedUpdates.wallpaperBrightness = Math.max(0.2, Math.min(1.0, Math.round(b * 100) / 100));
      } else {
        delete sanitizedUpdates.wallpaperBrightness;
      }
    }
    if (sanitizedUpdates.hologramOpacity !== undefined) {
      const op = Number(sanitizedUpdates.hologramOpacity);
      if (!isNaN(op)) {
        sanitizedUpdates.hologramOpacity = Math.max(0, Math.min(100, Math.round(op)));
      } else {
        delete sanitizedUpdates.hologramOpacity;
      }
    }
    if (sanitizedUpdates.hologramAmount !== undefined) {
      const am = Number(sanitizedUpdates.hologramAmount);
      if (!isNaN(am)) {
        sanitizedUpdates.hologramAmount = Math.max(0, Math.min(100, Math.round(am)));
      } else {
        delete sanitizedUpdates.hologramAmount;
      }
    }

    const nextVersion = (current.version || 0) + 1;
    const now = Date.now();

    const merged: UserPreferences = {
      ...current,
      ...sanitizedUpdates,
      updatedAt: now,
      version: nextVersion,
    };

    db.userPreferences[u] = merged;
    // Keep global preferences in sync as fallback
    db.preferences = {
      ...db.preferences,
      ...sanitizedUpdates,
      updatedAt: now,
      version: nextVersion,
    };

    await this.persist();
    return merged;
  }
}

export const db = new Database();
