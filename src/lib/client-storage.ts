// Stark OS Client-Side Storage Manager (IndexedDB + LocalStorage)
// Provides instant zero-config resilience for Vercel Serverless deployments.
// Allows large custom live wallpaper videos (MP4/WebM) and files to persist in browser storage.

import { CloudFile, UserPreferences } from './types';

const DB_NAME = 'stark_edith_desktop_db';
const DB_VERSION = 1;

export interface ClientWallpaperRecord {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
  size: number;
  createdAt: string;
}

export interface ClientFileRecord {
  id: string;
  name: string;
  mimeType: string;
  category: string;
  folderId: string | null;
  blob: Blob;
  size: number;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('wallpapers')) {
        db.createObjectStore('wallpapers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// WALLPAPERS
// ==========================================

export async function saveClientWallpaper(
  file: File | Blob,
  filename?: string
): Promise<{ id: string; url: string; name: string }> {
  const db = await openDB();
  const id = `client_wp_${Date.now()}`;
  const name = filename || (file instanceof File ? file.name : 'custom_wallpaper');
  const mimeType = file.type || 'video/mp4';

  const record: ClientWallpaperRecord = {
    id,
    name,
    mimeType,
    blob: file,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('wallpapers', 'readwrite');
    const store = tx.objectStore('wallpapers');
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const url = URL.createObjectURL(file);
  try {
    localStorage.setItem('stark_active_wallpaper_id', id);
    localStorage.setItem('stark_active_wallpaper_name', name);
  } catch {}

  return { id, url, name };
}

export async function getClientWallpaperBlob(
  id: string,
  name?: string,
  size?: number
): Promise<Blob | null> {
  if (!id && !name) return null;
  try {
    const db = await openDB();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');

    // 1. Check wallpapers store by cleanId and raw id
    const wpBlob = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction('wallpapers', 'readonly');
        const store = tx.objectStore('wallpapers');
        const req = store.get(cleanId);
        req.onsuccess = () => {
          const res = req.result as ClientWallpaperRecord | undefined;
          if (res?.blob) return resolve(res.blob);
          if (id !== cleanId) {
            const req2 = store.get(id);
            req2.onsuccess = () => resolve((req2.result as ClientWallpaperRecord)?.blob || null);
            req2.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (wpBlob) return wpBlob;

    // 2. Check files store by cleanId and raw id
    const fileBlob = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(cleanId);
        req.onsuccess = () => {
          const res = req.result as ClientFileRecord | undefined;
          if (res?.blob) return resolve(res.blob);
          if (id !== cleanId) {
            const req2 = store.get(id);
            req2.onsuccess = () => resolve((req2.result as ClientFileRecord)?.blob || null);
            req2.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (fileBlob) return fileBlob;

    // 3. Fallback scan: Search all items in wallpapers & files by ID or name
    const allWallpapers = await new Promise<ClientWallpaperRecord[]>((resolve) => {
      try {
        const tx = db.transaction('wallpapers', 'readonly');
        const store = tx.objectStore('wallpapers');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as ClientWallpaperRecord[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const wpMatch = allWallpapers.find(
      (r) =>
        r.id === cleanId ||
        r.id === id ||
        `local_${r.id}` === id ||
        (name && r.name === name)
    );
    if (wpMatch?.blob) return wpMatch.blob;

    const allFiles = await new Promise<ClientFileRecord[]>((resolve) => {
      try {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as ClientFileRecord[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const fileMatch = allFiles.find(
      (r) =>
        r.id === cleanId ||
        r.id === id ||
        `local_${r.id}` === id ||
        (name && r.name === name)
    );
    if (fileMatch?.blob) return fileMatch.blob;

    // 4. If no specific ID matched, return the most recent custom wallpaper
    if (allWallpapers.length > 0) {
      return allWallpapers[allWallpapers.length - 1].blob;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getClientMediaUrl(id: string): Promise<string | null> {
  const blob = await getClientWallpaperBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getActiveClientWallpaperUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const activeId = localStorage.getItem('stark_active_wallpaper_id');
  if (!activeId) return null;

  const blob = await getClientWallpaperBlob(activeId);
  if (!blob) return null;

  return URL.createObjectURL(blob);
}

// ==========================================
// OFFLINE FILES (DOCUMENTS, PHOTOS, MEDIA)
// ==========================================

export async function saveClientOfflineFile(
  file: File,
  folderId: string | null = null
): Promise<CloudFile> {
  const db = await openDB();
  const id = `local_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const mimeType = file.type || 'application/octet-stream';

  const getCategory = (mime: string, name: string): any => {
    const n = name.toLowerCase();
    if (mime.startsWith('image/')) return 'photos';
    if (mime.startsWith('video/')) return 'videos';
    if (mime.startsWith('audio/')) return 'music';
    if (
      mime.includes('pdf') ||
      mime.includes('word') ||
      mime.includes('document') ||
      mime.includes('sheet') ||
      mime.includes('text') ||
      n.endsWith('.txt') ||
      n.endsWith('.pdf') ||
      n.endsWith('.docx')
    ) {
      return 'documents';
    }
    return 'other';
  };

  const category = getCategory(mimeType, file.name);

  const record: ClientFileRecord = {
    id,
    name: file.name,
    mimeType,
    category,
    folderId,
    blob: file,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const cloudFile: CloudFile = {
    id,
    name: file.name,
    size: file.size,
    mimeType,
    category,
    folderId,
    storageKey: `local_${id}`,
    storageProvider: 'local',
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
    isFavorite: false,
    isTrash: false,
  };

  return cloudFile;
}

export async function getClientOfflineFiles(): Promise<CloudFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []) as ClientFileRecord[];
        const cloudFiles: CloudFile[] = records.map((r) => ({
          id: r.id,
          name: r.name,
          size: r.size,
          mimeType: r.mimeType,
          category: r.category as any,
          folderId: r.folderId,
          storageKey: `local_${r.id}`,
          storageProvider: 'local',
          createdAt: r.createdAt,
          updatedAt: r.createdAt,
          isFavorite: false,
          isTrash: false,
        }));
        const seen = new Set<string>();
        const uniqueFiles: CloudFile[] = [];
        for (const f of cloudFiles) {
          const key = f.name.toLowerCase().trim() + '_' + f.size;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFiles.push(f);
          }
        }
        resolve(uniqueFiles);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getClientOfflineFileBlob(
  id: string,
  name?: string
): Promise<Blob | null> {
  if (!id && !name) return null;
  try {
    const db = await openDB();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');

    // 1. Check files store
    const fileBlob = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(cleanId);
        req.onsuccess = () => {
          const res = req.result as ClientFileRecord | undefined;
          if (res?.blob) return resolve(res.blob);
          if (id !== cleanId) {
            const req2 = store.get(id);
            req2.onsuccess = () => resolve((req2.result as ClientFileRecord)?.blob || null);
            req2.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (fileBlob) return fileBlob;

    // 2. Check wallpapers store
    const wpBlob = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction('wallpapers', 'readonly');
        const store = tx.objectStore('wallpapers');
        const req = store.get(cleanId);
        req.onsuccess = () => {
          const res = req.result as ClientWallpaperRecord | undefined;
          if (res?.blob) return resolve(res.blob);
          if (id !== cleanId) {
            const req2 = store.get(id);
            req2.onsuccess = () => resolve((req2.result as ClientWallpaperRecord)?.blob || null);
            req2.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (wpBlob) return wpBlob;

    // 3. Fallback scan by match
    const allFiles = await new Promise<ClientFileRecord[]>((resolve) => {
      try {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as ClientFileRecord[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });

    const match = allFiles.find(
      (r) =>
        r.id === cleanId ||
        r.id === id ||
        `local_${r.id}` === id ||
        (name && r.name === name)
    );
    if (match?.blob) return match.blob;

    return null;
  } catch {
    return null;
  }
}

export async function deleteClientOfflineFile(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const cleanId = id.replace(/^indexeddb:\/\//, '').replace(/^local_/, '');
    await new Promise<void>((resolve) => {
      const tx = db.transaction(['files', 'wallpapers'], 'readwrite');
      tx.objectStore('files').delete(cleanId);
      tx.objectStore('files').delete(id);
      tx.objectStore('wallpapers').delete(cleanId);
      tx.objectStore('wallpapers').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// PREFERENCES CACHE
// ==========================================

export function saveClientPreferences(
  prefs: Partial<UserPreferences>,
  username = 'admin'
) {
  if (typeof window === 'undefined') return;
  try {
    const u = (username || 'admin').trim().toLowerCase();
    const key = `stark_desktop_preferences_${u}`;
    const raw = localStorage.getItem(key);
    let current: Partial<UserPreferences> = {};
    if (raw) {
      try {
        current = JSON.parse(raw);
      } catch {}
    }
    const updated = { ...current, ...prefs, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

export function getClientPreferences(
  username = 'admin'
): Partial<UserPreferences> | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = (username || 'admin').trim().toLowerCase();
    const key = `stark_desktop_preferences_${u}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
