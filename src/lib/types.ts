export type FileCategory =
  | 'documents'
  | 'photos'
  | 'videos'
  | 'music'
  | 'downloads'
  | 'other';

export interface CloudFile {
  id: string;
  name: string;
  size: number; // in bytes
  mimeType: string;
  category: FileCategory;
  folderId: string | null; // null = root or virtual
  storageKey: string;
  storageProvider: 'supabase' | 'r2' | 'local';
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isTrash?: boolean;
  trashDate?: string | null;
  publicUrl?: string;
  thumbnailUrl?: string;
}

export interface CloudFolder {
  id: string;
  name: string;
  parentId: string | null;
  isSystem?: boolean;
  systemType?:
    | 'documents'
    | 'photos'
    | 'videos'
    | 'music'
    | 'downloads'
    | 'other'
    | 'recent'
    | 'favorites'
    | 'trash';
  icon?: string;
  createdAt: string;
  updatedAt: string;
  isTrash?: boolean;
}

export interface CloudNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isTrash?: boolean;
  trashDate?: string | null;
  isFavorite?: boolean;
}

export type ThemePreset =
  | 'jarvis-cyan'
  | 'spiderman-suit'
  | 'arc-plasma'
  | 'edith-stealth';

export type LiveWallpaperType =
  | 'spiderman-city'
  | 'spiderman-rescue'
  | 'blue-hologram'
  | 'arc-reactor'
  | 'edith-orbital'
  | 'quantum-core'
  | 'custom-video'
  | 'custom-image';

export interface UserPreferences {
  theme: ThemePreset;
  wallpaperType: LiveWallpaperType;
  customWallpaperUrl?: string;
  wallpaperBrightness: number; // 0.2 to 1.0
  hologramOpacity: number; // 0 to 100
  hologramAmount: number; // 0 to 100
  storageCapacityGB: number; // e.g. 15
  desktopLayout?: 'grid' | 'free';
}

export interface StorageStats {
  totalCapacityBytes: number;
  usedBytes: number;
  remainingBytes: number;
  usedPercentage: number;
  totalFiles: number;
  totalFolders: number;
  byCategory: {
    documents: { bytes: number; count: number };
    photos: { bytes: number; count: number };
    videos: { bytes: number; count: number };
    music: { bytes: number; count: number };
    downloads: { bytes: number; count: number };
    other: { bytes: number; count: number };
    trash: { bytes: number; count: number };
  };
  storageProvider: string;
}

export interface WindowState {
  id: string;
  title: string;
  type:
    | 'explorer'
    | 'image-viewer'
    | 'video-player'
    | 'audio-player'
    | 'document-viewer'
    | 'wallpapers'
    | 'hologram-controls'
    | 'personalization'
    | 'storage-dashboard'
    | 'file-details'
    | 'text-saver';
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: any; // e.g. current folderId, category, or active file/note
}

export interface UserSession {
  username: string;
  isAuthenticated: boolean;
  role: 'admin';
}
