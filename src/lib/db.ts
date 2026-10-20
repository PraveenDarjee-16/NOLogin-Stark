import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { CloudFile, CloudFolder, CloudNote, UserPreferences } from './types';

interface DatabaseSchema {
  files: CloudFile[];
  folders: CloudFolder[];
  notes: CloudNote[];
  preferences: UserPreferences;
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

import { createClient, SupabaseClient } from '@supabase/supabase-js';

class Database {
  private dbPath: string;
  private memoryCache: DatabaseSchema | null = null;
  private isSaving = false;
  private supabaseClient: SupabaseClient | null = null;
  private supabaseBucket: string = 'personal-cloud';

  constructor() {
    if (process.env.VERCEL) {
      this.dbPath = path.join(os.tmpdir(), 'database.json');
    } else {
      this.dbPath = path.join(process.cwd(), 'data', 'database.json');
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
  }

  private async load(): Promise<DatabaseSchema> {
    if (this.memoryCache) return this.memoryCache;

    // 1. If Supabase Storage is configured, prioritize reading from cloud bucket
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from(this.supabaseBucket)
          .download('_system/database.json');

        if (data && !error) {
          const raw = await data.text();
          const parsed = JSON.parse(raw);
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

          this.memoryCache = parsed;
          return parsed;
        }
      } catch (cloudErr) {
        console.warn('Could not read database.json from Supabase, checking local/seed:', cloudErr);
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
        const data = JSON.parse(raw);
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

        this.memoryCache = data;
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
      version: 1,
    };
    this.memoryCache = initial;
    await this.persist();
    return initial;
  }

  private async persist(): Promise<void> {
    if (!this.memoryCache || this.isSaving) return;
    this.isSaving = true;
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
    } catch (err) {
      console.error('Error saving database:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Files ---
  async getFiles(): Promise<CloudFile[]> {
    const db = await this.load();
    return db.files;
  }

  async getFileById(id: string): Promise<CloudFile | null> {
    const db = await this.load();
    return db.files.find((f) => f.id === id) || null;
  }

  async addFile(file: CloudFile): Promise<CloudFile> {
    const db = await this.load();
    db.files.push(file);
    await this.persist();
    return file;
  }

  async updateFile(id: string, updates: Partial<CloudFile>): Promise<CloudFile | null> {
    const db = await this.load();
    const idx = db.files.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    db.files[idx] = {
      ...db.files[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return db.files[idx];
  }

  async deleteFilePermanently(id: string): Promise<boolean> {
    const db = await this.load();
    const prevLen = db.files.length;
    db.files = db.files.filter((f) => f.id !== id);
    if (db.files.length !== prevLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Folders ---
  async getFolders(): Promise<CloudFolder[]> {
    const db = await this.load();
    return db.folders;
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
  async getNotes(): Promise<CloudNote[]> {
    const db = await this.load();
    return db.notes || [];
  }

  async getNoteById(id: string): Promise<CloudNote | null> {
    const db = await this.load();
    return db.notes?.find((n) => n.id === id) || null;
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
    updates: Partial<CloudNote>
  ): Promise<CloudNote | null> {
    const db = await this.load();
    db.notes = db.notes || [];
    const idx = db.notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    db.notes[idx] = {
      ...db.notes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.persist();
    return db.notes[idx];
  }

  async deleteNotePermanently(id: string): Promise<boolean> {
    const db = await this.load();
    db.notes = db.notes || [];
    const prevLen = db.notes.length;
    db.notes = db.notes.filter((n) => n.id !== id);
    if (db.notes.length !== prevLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Preferences ---
  async getPreferences(): Promise<UserPreferences> {
    const db = await this.load();
    return db.preferences || { ...DEFAULT_PREFERENCES };
  }

  async updatePreferences(
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const db = await this.load();
    db.preferences = {
      ...db.preferences,
      ...updates,
    };
    await this.persist();
    return db.preferences;
  }
}

export const db = new Database();
