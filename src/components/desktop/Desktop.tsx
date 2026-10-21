'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CloudFile,
  CloudFolder,
  WindowState,
  UserPreferences,
  StorageStats,
  LiveWallpaperType,
} from '@/lib/types';
import LiveWallpaperCanvas from '../wallpapers/LiveWallpaperCanvas';
import HologramOverlay from './HologramOverlay';
import TelemetryHeader from './TelemetryHeader';
import DesktopIcon, { DesktopShortcut } from './DesktopIcon';
import Taskbar from './Taskbar';
import Window from './Window';
import FileExplorerWindow from '../explorer/FileExplorerWindow';
import TextSaverWindow from '../notes/TextSaverWindow';
import WallpaperGalleryWindow from '../wallpapers/WallpaperGalleryWindow';
import HologramControlsWindow from '../settings/HologramControlsWindow';
import PersonalizationWindow from '../settings/PersonalizationWindow';
import StorageDashboardWindow from '../settings/StorageDashboardWindow';
import ImageViewerWindow from '../previews/ImageViewerWindow';
import VideoPlayerWindow from '../previews/VideoPlayerWindow';
import AudioPlayerWindow from '../previews/AudioPlayerWindow';
import DocumentViewerWindow from '../previews/DocumentViewerWindow';
import SpiderWebRecallOverlay from './SpiderWebRecallOverlay';
import HackerModeOverlay from './HackerModeOverlay';
import {
  saveClientPreferences,
  getClientPreferences,
  getClientOfflineFiles,
} from '@/lib/client-storage';

interface Props {
  username: string;
  onLogout: () => void;
}

const DEFAULT_PREFS: UserPreferences = {
  theme: 'jarvis-cyan',
  wallpaperType: 'spiderman-city',
  wallpaperBrightness: 0.85,
  hologramOpacity: 65,
  hologramAmount: 75,
  storageCapacityGB: 15,
  desktopLayout: 'grid',
};

// Exactly 5 main shortcuts on the LEFT of the central reactor
const LEFT_SHORTCUTS: DesktopShortcut[] = [
  { id: 'shortcut-documents', name: 'Documents', systemType: 'documents' },
  { id: 'shortcut-photos', name: 'Photos', systemType: 'photos' },
  { id: 'shortcut-videos', name: 'Videos', systemType: 'videos' },
  { id: 'shortcut-music', name: 'Music', systemType: 'music' },
  { id: 'shortcut-text-saver', name: 'Text Saver', systemType: 'text-saver' },
];

// Exactly 5 main shortcuts on the RIGHT of the central reactor
const RIGHT_SHORTCUTS: DesktopShortcut[] = [
  { id: 'shortcut-downloads', name: 'Downloads', systemType: 'downloads' },
  { id: 'shortcut-other', name: 'Other Files', systemType: 'other' },
  { id: 'shortcut-recent', name: 'Recently Uploaded', systemType: 'recent' },
  { id: 'shortcut-favorites', name: 'Favourites', systemType: 'favorites' },
  { id: 'shortcut-trash', name: 'Trash', systemType: 'trash' },
];

export default function Desktop({ username, onLogout }: Props) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const cached = getClientPreferences(username);
      if (cached) {
        return { ...DEFAULT_PREFS, ...cached };
      }
    }
    return DEFAULT_PREFS;
  });
  const [isPreferencesLoaded, setIsPreferencesLoaded] = useState(false);

  // Wallpaper Lifecycle Status: 'loading' | 'ready' | 'error'
  const [wallpaperStatus, setWallpaperStatus] = useState<'loading' | 'ready' | 'error'>(() => {
    if (typeof window !== 'undefined') {
      const cached = getClientPreferences(username);
      if (cached && cached.wallpaperType) {
        return 'ready';
      }
    }
    return 'loading';
  });

  // Anti-conflict & debounced save tracking
  const lastLocalMutationRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Partial<UserPreferences>>({});
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('stark_cached_storage_stats');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  });

  // Windows State Manager
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const nextZIndex = useRef(100);

  // Selected desktop shortcut
  const [selectedShortcutId, setSelectedShortcutId] = useState<string | null>(null);

  // CRAZY Animation Mode State (Dual-case: Case 1 windows closing sequence, Case 2 reactor overdrive)
  const [isCrazyMode, setIsCrazyMode] = useState(false);
  const [crazyPhase, setCrazyPhase] = useState<'closing-windows' | 'case2-active' | null>(null);
  const crazyTimersRef = useRef<NodeJS.Timeout[]>([]);

  const clearCrazyTimers = () => {
    crazyTimersRef.current.forEach(clearTimeout);
    crazyTimersRef.current = [];
  };

  // HACKER Mode State (5-second cinematic entrance + persistent breach simulation)
  const [isHackerMode, setIsHackerMode] = useState(false);
  const [hackerPhase, setHackerPhase] = useState<'entrance' | 'simulation' | null>(null);
  const hackerEntranceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearHackerTimers = () => {
    if (hackerEntranceTimerRef.current) {
      clearTimeout(hackerEntranceTimerRef.current);
      hackerEntranceTimerRef.current = null;
    }
  };

  const handleToggleHacker = () => {
    if (isHackerMode) {
      handleExitHacker();
    } else {
      clearHackerTimers();
      setIsHackerMode(true);
      setHackerPhase('entrance');
      // Transition from 5s entrance to persistent simulation
      hackerEntranceTimerRef.current = setTimeout(() => {
        setHackerPhase('simulation');
      }, 5000);
    }
  };

  const handleExitHacker = () => {
    clearHackerTimers();
    setIsHackerMode(false);
    setHackerPhase(null);
  };

  // Hidden upload input for desktop taskbar quick upload
  const desktopUploadRef = useRef<HTMLInputElement | null>(null);

  // Fetch initial preferences, folders, and storage stats
  const fetchPreferences = async () => {
    // 1. Instantly apply cached client preferences for this user if present
    const cached = getClientPreferences(username);
    if (cached) {
      setPreferences((prev) => ({ ...prev, ...cached }));
      if (cached.wallpaperType) {
        setWallpaperStatus('ready');
      }
      if (cached.theme) document.documentElement.setAttribute('data-theme', cached.theme);
      if (cached.hologramOpacity !== undefined) {
        document.documentElement.style.setProperty(
          '--hologram-opacity',
          (cached.hologramOpacity / 100).toString()
        );
      }
      if (cached.hologramAmount !== undefined) {
        document.documentElement.style.setProperty(
          '--hologram-amount',
          (cached.hologramAmount / 100).toString()
        );
      }
      if (cached.wallpaperBrightness !== undefined) {
        document.documentElement.style.setProperty(
          '--wallpaper-brightness',
          cached.wallpaperBrightness.toString()
        );
      }
    }

    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.preferences) {
        const serverPrefs = data.preferences;
        // Stale response guard: If user interacted while network was in-flight, do not overwrite!
        if (Date.now() - lastLocalMutationRef.current > 3000) {
          setPreferences(serverPrefs);
          saveClientPreferences(serverPrefs, username);
          if (serverPrefs.theme) document.documentElement.setAttribute('data-theme', serverPrefs.theme);
          if (serverPrefs.hologramOpacity !== undefined) {
            document.documentElement.style.setProperty(
              '--hologram-opacity',
              (serverPrefs.hologramOpacity / 100).toString()
            );
          }
          if (serverPrefs.hologramAmount !== undefined) {
            document.documentElement.style.setProperty(
              '--hologram-amount',
              (serverPrefs.hologramAmount / 100).toString()
            );
          }
          if (serverPrefs.wallpaperBrightness !== undefined) {
            document.documentElement.style.setProperty(
              '--wallpaper-brightness',
              serverPrefs.wallpaperBrightness.toString()
            );
          }
        }
        setWallpaperStatus('ready');
      }
    } catch (e) {
      console.error('Failed to load preferences from server, active via local client cache:', e);
      // DO NOT overwrite with default wallpaper! Keep current cached or valid state
      setWallpaperStatus((prev) => (prev === 'loading' ? 'ready' : prev));
    } finally {
      setIsPreferencesLoaded(true);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (data.folders) {
        setFolders(data.folders);
      }
    } catch (e) {
      console.error('Failed to load folders:', e);
    }
  };

  const fetchStorageStats = async () => {
    try {
      let serverFiles: CloudFile[] = [];
      let serverStats: StorageStats | null = null;
      try {
        const [statsRes, filesRes] = await Promise.all([
          fetch('/api/storage/stats'),
          fetch('/api/files'),
        ]);
        if (statsRes.ok) serverStats = await statsRes.json();
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          if (filesData.files) serverFiles = filesData.files;
        }
      } catch {}

      // Retrieve local offline files from IndexedDB
      let offlineFiles: CloudFile[] = [];
      try {
        offlineFiles = await getClientOfflineFiles();
      } catch {}

      // Merge and deduplicate all files to compute accurate storage usage
      const combined = [...serverFiles, ...offlineFiles];
      const seen = new Set<string>();
      const allFiles = combined.filter((f) => {
        const key = f.name.toLowerCase().trim() + '_' + f.size;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Guard against transient 0-byte cold start drop if we previously had cached stats
      if (allFiles.length === 0 && serverFiles.length === 0 && offlineFiles.length === 0) {
        try {
          const raw = localStorage.getItem('stark_cached_storage_stats');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.usedBytes > 0) {
              setStorageStats(parsed);
              return;
            }
          }
        } catch {}
      }

      const totalCap = serverStats?.totalCapacityBytes || 15 * 1024 * 1024 * 1024;
      let usedBytes = 0;
      const byCategory: StorageStats['byCategory'] = {
        documents: { bytes: 0, count: 0 },
        photos: { bytes: 0, count: 0 },
        videos: { bytes: 0, count: 0 },
        music: { bytes: 0, count: 0 },
        downloads: { bytes: 0, count: 0 },
        other: { bytes: 0, count: 0 },
        trash: { bytes: 0, count: 0 },
      };

      for (const f of allFiles) {
        const sz = f.size || 0;
        usedBytes += sz;
        if (f.isTrash) {
          byCategory.trash.bytes += sz;
          byCategory.trash.count += 1;
        } else {
          const cat = (f.category || 'other') as keyof typeof byCategory;
          if (byCategory[cat]) {
            byCategory[cat].bytes += sz;
            byCategory[cat].count += 1;
          } else {
            byCategory.other.bytes += sz;
            byCategory.other.count += 1;
          }
        }
      }

      const remaining = Math.max(0, totalCap - usedBytes);
      const pct = Math.min(100, parseFloat(((usedBytes / totalCap) * 100).toFixed(1)));
      const finalStats: StorageStats = {
        totalCapacityBytes: totalCap,
        usedBytes,
        remainingBytes: remaining,
        usedPercentage: pct,
        byCategory,
        storageProvider: serverStats?.storageProvider || 'local',
        totalFiles: allFiles.length,
        totalFolders: serverStats?.totalFolders || 0,
      };

      setStorageStats(finalStats);
      try {
        localStorage.setItem('stark_cached_storage_stats', JSON.stringify(finalStats));
      } catch {}
    } catch (e) {
      console.error('Failed to load storage stats:', e);
    }
  };

  useEffect(() => {
    fetchPreferences();
    fetchFolders();
    fetchStorageStats();
  }, []);

  // Real-time synchronization across devices (wallpapers, themes, and calibration)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      // Guard: Do not poll or clobber if user recently interacted (< 4500ms) or has uncommitted saves
      if (Date.now() - lastLocalMutationRef.current < 4500) return;
      if (Object.keys(pendingUpdatesRef.current).length > 0) return;

      try {
        const res = await fetch('/api/preferences');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.preferences) return;

        // Verify again after network roundtrip that user hasn't made new changes
        if (Date.now() - lastLocalMutationRef.current < 4500) return;

        const p = data.preferences;

        setPreferences((prev) => {
          // If server preference is older than or equal to our local mutation timestamp, ignore it
          if (p.updatedAt && prev.updatedAt && p.updatedAt <= prev.updatedAt) {
            return prev;
          }

          const isDiff =
            prev.wallpaperType !== p.wallpaperType ||
            prev.customWallpaperUrl !== p.customWallpaperUrl ||
            prev.theme !== p.theme ||
            prev.hologramOpacity !== p.hologramOpacity ||
            prev.hologramAmount !== p.hologramAmount ||
            prev.wallpaperBrightness !== p.wallpaperBrightness;

          if (isDiff) {
            const updated = { ...prev, ...p };
            saveClientPreferences(updated, username);
            return updated;
          }
          return prev;
        });
      } catch {}
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [username]);

  // Update theme & CSS variables when preferences change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
    document.documentElement.style.setProperty(
      '--hologram-opacity',
      (preferences.hologramOpacity / 100).toString()
    );
    document.documentElement.style.setProperty(
      '--hologram-amount',
      (preferences.hologramAmount / 100).toString()
    );
    document.documentElement.style.setProperty(
      '--wallpaper-brightness',
      preferences.wallpaperBrightness.toString()
    );
  }, [preferences]);

  // CRAZY Animation Toggle Handler: Case 1 (windows open) & Case 2 (0 windows open)
  const handleToggleCrazy = () => {
    // If clicked while an animation sequence is running, cleanly stop/cancel or finish immediately
    if (isCrazyMode || crazyPhase !== null) {
      clearCrazyTimers();
      if (crazyPhase === 'closing-windows') {
        // Ensure all application windows are closed in state
        setWindows([]);
      }
      setIsCrazyMode(false);
      setCrazyPhase(null);
      return;
    }

    clearCrazyTimers();

    // Check whether any application windows are currently open on the desktop
    if (windows.length > 0) {
      // ==========================================
      // CASE 1: ONE OR MORE WINDOWS ARE OPEN
      // Dynamic duration based on how many tabs/windows are open:
      // Each window has a 450ms stagger + 1350ms vanish animation.
      // More open tabs = proportionally more time for sequential Spider-Man web recall!
      // ==========================================
      const staggerInterval = 450;
      const windowVanishDuration = 1350;
      const totalCloseDuration = (windows.length - 1) * staggerInterval + windowVanishDuration;
      const totalSequenceDuration = totalCloseDuration + 450;

      setIsCrazyMode(true);
      setCrazyPhase('closing-windows');

      // Staggered Spider-Man web latch & fly-to-reactor completes dynamically
      const closeTimer = setTimeout(() => {
        // ACTUALLY close the application windows through the window manager state
        setWindows([]);
      }, totalCloseDuration);

      // Restore normal desktop interface after sequence finishes
      const endTimer = setTimeout(() => {
        setIsCrazyMode(false);
        setCrazyPhase(null);
      }, totalSequenceDuration);

      crazyTimersRef.current = [closeTimer, endTimer];
    } else {
      // ==========================================
      // CASE 2: NO APPLICATION WINDOWS ARE OPEN
      // Trigger 3–5 second spectacular cinematic holographic animation around the central reactor
      // ==========================================
      setIsCrazyMode(true);
      setCrazyPhase('case2-active');

      const endTimer = setTimeout(() => {
        setIsCrazyMode(false);
        setCrazyPhase(null);
      }, 4200);

      crazyTimersRef.current = [endTimer];
    }
  };

  useEffect(() => {
    return () => {
      clearCrazyTimers();
    };
  }, []);

  // Unique Window Key generator so categories/features open independent overlapping windows!
  const getWindowKey = (type: WindowState['type'], data?: any): string => {
    if (type === 'explorer') {
      if (data?.category) return `win_explorer_${data.category}`;
      if (data?.systemView) return `win_explorer_${data.systemView}`;
      if (data?.folderId) return `win_explorer_folder_${data.folderId}`;
      return 'win_explorer_root';
    }
    if (type === 'text-saver') return 'win_text_saver';
    if (type === 'wallpapers') return 'win_wallpapers';
    if (type === 'hologram-controls') return 'win_hologram_controls';
    if (type === 'storage-dashboard') return 'win_storage_dashboard';
    if (type === 'personalization') return 'win_personalization';
    if (data?.id) return `win_${type}_${data.id}`;
    return `win_${type}_${Date.now()}`;
  };

  // Window Management Handlers
  const bringToFront = (id: string) => {
    nextZIndex.current += 1;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: nextZIndex.current, isMinimized: false } : w
      )
    );
    setActiveWindowId(id);
  };

  const openWindow = (
    type: WindowState['type'],
    title: string,
    data?: any,
    defaultSize = { width: 880, height: 560 }
  ) => {
    const winKey = getWindowKey(type, data);
    const existing = windows.find((w) => w.id === winKey);
    if (existing) {
      bringToFront(existing.id);
      return;
    }

    nextZIndex.current += 1;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const offset = (windows.length % 6) * 32;
    const posX = isMobile ? 0 : Math.max(30, 80 + offset);
    const posY = isMobile ? 44 : Math.max(50, 60 + offset);

    const newWin: WindowState = {
      id: winKey,
      title,
      type,
      isOpen: true,
      isMinimized: false,
      isMaximized: isMobile,
      zIndex: nextZIndex.current,
      position: { x: posX, y: posY },
      size: isMobile ? { width: window.innerWidth, height: window.innerHeight - 100 } : defaultSize,
      data,
    };

    setWindows((prev) => [...prev, newWin]);
    setActiveWindowId(winKey);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const toggleMaximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const toggleTaskbarWindow = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    if (win.isMinimized || activeWindowId !== id) {
      bringToFront(id);
    } else {
      minimizeWindow(id);
    }
  };

  // Preview file routing dispatcher
  const handlePreviewFile = (file: CloudFile) => {
    if (file.category === 'photos') {
      openWindow('image-viewer', `Photo: ${file.name}`, file, { width: 780, height: 540 });
    } else if (file.category === 'videos') {
      openWindow('video-player', `Video: ${file.name}`, file, { width: 820, height: 520 });
    } else if (file.category === 'music') {
      openWindow('audio-player', `Audio: ${file.name}`, file, { width: 500, height: 420 });
    } else {
      openWindow('document-viewer', `Document: ${file.name}`, file, { width: 820, height: 560 });
    }
  };

  // Open specific shortcut (Left or Right)
  const handleOpenShortcut = (shortcut: DesktopShortcut) => {
    switch (shortcut.systemType) {
      case 'documents':
        openWindow('explorer', 'Documents Archive', { category: 'documents' }, { width: 880, height: 580 });
        break;
      case 'photos':
        openWindow('explorer', 'Photos Archive', { category: 'photos' }, { width: 880, height: 580 });
        break;
      case 'videos':
        openWindow('explorer', 'Videos Archive', { category: 'videos' }, { width: 880, height: 580 });
        break;
      case 'music':
        openWindow('explorer', 'Music Archive', { category: 'music' }, { width: 880, height: 580 });
        break;
      case 'text-saver':
        openWindow('text-saver', 'Text Saver // Cloud Notepad', null, { width: 840, height: 550 });
        break;
      case 'downloads':
        openWindow('explorer', 'Downloads Archive', { category: 'downloads' }, { width: 880, height: 580 });
        break;
      case 'other':
        openWindow('explorer', 'Other Files Archive', { category: 'other' }, { width: 880, height: 580 });
        break;
      case 'recent':
        openWindow('explorer', 'Recently Uploaded', { systemView: 'recent' }, { width: 880, height: 580 });
        break;
      case 'favorites':
        openWindow('explorer', 'Favourites Archive', { systemView: 'favorites' }, { width: 880, height: 580 });
        break;
      case 'trash':
        openWindow('explorer', 'Trash Bin', { systemView: 'trash' }, { width: 880, height: 580 });
        break;
    }
  };

  // Unified Preference Queue with Debounced Auto-Save and Instant UI Response
  const queuePreferenceUpdate = (
    updates: Partial<UserPreferences>,
    immediate = false
  ) => {
    lastLocalMutationRef.current = Date.now();
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // 1. Immediately apply to React state
    setPreferences((prev) => {
      const next = { ...prev, ...updates, updatedAt: Date.now() };
      saveClientPreferences(next, username);
      return next;
    });

    // 2. Immediately apply to CSS variables & DOM attributes
    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    if (updates.hologramOpacity !== undefined) {
      document.documentElement.style.setProperty(
        '--hologram-opacity',
        (updates.hologramOpacity / 100).toString()
      );
    }
    if (updates.hologramAmount !== undefined) {
      document.documentElement.style.setProperty(
        '--hologram-amount',
        (updates.hologramAmount / 100).toString()
      );
    }
    if (updates.wallpaperBrightness !== undefined) {
      document.documentElement.style.setProperty(
        '--wallpaper-brightness',
        updates.wallpaperBrightness.toString()
      );
    }

    // 3. Clear existing debounce timer
    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
      saveDebounceTimerRef.current = null;
    }

    if (immediate) {
      flushSavePreferences();
    } else {
      setSaveStatus('saving');
      saveDebounceTimerRef.current = setTimeout(() => {
        flushSavePreferences();
      }, 450);
    }
  };

  const flushSavePreferences = async () => {
    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
      saveDebounceTimerRef.current = null;
    }

    const payload = { ...pendingUpdatesRef.current };
    if (Object.keys(payload).length === 0) {
      Object.assign(payload, preferences);
    }
    pendingUpdatesRef.current = {};

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.preferences) {
        if (Date.now() - lastLocalMutationRef.current < 2000) {
          setPreferences((prev) => ({
            ...prev,
            version: data.preferences.version,
            updatedAt: data.preferences.updatedAt,
          }));
        }
      }

      setSaveStatus('saved');
      setSaveErrorMessage(null);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: any) {
      console.warn('Failed to sync preferences to cloud, preserved in local browser session:', e);
      // DO NOT reset preferences to default!
      setSaveStatus('error');
      setSaveErrorMessage('Cloud sync failed. Preferences preserved locally.');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onLogout();
    }
  };

  return (
    <div
      className={`desktop-container ${isCrazyMode ? 'crazy-mode-active' : ''}`}
      onClick={() => setSelectedShortcutId(null)}
    >
      <input
        ref={desktopUploadRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={async (e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            openWindow('explorer', 'Cloud File Explorer', { uploadFiles: files });
            e.target.value = '';
          }
        }}
      />

      {/* 1. Cinematic Live Wallpaper Layer */}
      <div className="desktop-wallpaper-layer">
        <LiveWallpaperCanvas
          wallpaperType={preferences.wallpaperType}
          customWallpaperUrl={preferences.customWallpaperUrl}
          brightness={preferences.wallpaperBrightness}
          isLoading={wallpaperStatus === 'loading'}
        />
      </div>

      {/* 2. Holographic Scanlines & Particle Reticles */}
      <div className="desktop-hologram-layer">
        <HologramOverlay
          opacity={preferences.hologramOpacity}
          amount={preferences.hologramAmount}
          isCrazyMode={isCrazyMode}
          crazyPhase={crazyPhase}
        />
      </div>

      {/* 3. Telemetry HUD Top Header with CRAZY & HACKER Buttons */}
      <TelemetryHeader
        username={username}
        storageStats={storageStats}
        isCrazyMode={isCrazyMode}
        onToggleCrazy={handleToggleCrazy}
        isHackerMode={isHackerMode}
        onToggleHacker={handleToggleHacker}
        onOpenSettings={() =>
          openWindow('personalization', 'System Personalization & Themes', null, {
            width: 700,
            height: 560,
          })
        }
        onOpenWallpapers={() =>
          openWindow('wallpapers', 'Live Wallpaper Archive', null, { width: 880, height: 600 })
        }
        onOpenHologramControls={() =>
          openWindow('hologram-controls', 'Holographic Calibration Matrix', null, {
            width: 580,
            height: 500,
          })
        }
        onOpenStorage={() =>
          openWindow('storage-dashboard', 'Storage Capacity & Diagnostics', null, {
            width: 720,
            height: 600,
          })
        }
        onLogout={handleLogout}
      />

      {/* 4. Balanced Desktop Shortcuts Layout: 5 on LEFT, 5 on RIGHT, Center Reactor Void */}
      <main className="desktop-shortcuts-wrapper">
        {/* LEFT SIDE (5 shortcuts) */}
        <div className="shortcuts-column-left">
          {LEFT_SHORTCUTS.map((shortcut) => (
            <DesktopIcon
              key={shortcut.id}
              shortcut={shortcut}
              isSelected={selectedShortcutId === shortcut.id}
              onSelect={() => setSelectedShortcutId(shortcut.id)}
              onOpen={() => handleOpenShortcut(shortcut)}
            />
          ))}
        </div>

        {/* CENTER VOID: Preserves clear space for central holographic reactor */}
        <div className="shortcuts-center-void" />

        {/* RIGHT SIDE (5 shortcuts) */}
        <div className="shortcuts-column-right">
          {RIGHT_SHORTCUTS.map((shortcut) => (
            <DesktopIcon
              key={shortcut.id}
              shortcut={shortcut}
              isSelected={selectedShortcutId === shortcut.id}
              onSelect={() => setSelectedShortcutId(shortcut.id)}
              onOpen={() => handleOpenShortcut(shortcut)}
            />
          ))}
        </div>
      </main>

      {/* Spider-Man Web Recall Overlay (Web lines + EDITH Tech Telemetry) */}
      {crazyPhase === 'closing-windows' && (
        <SpiderWebRecallOverlay windows={windows} />
      )}

      {/* Full-Screen Cinematic Hacker Mode & Persistent Cyber Breach Simulation Overlay */}
      {isHackerMode && hackerPhase && (
        <HackerModeOverlay phase={hackerPhase} onExit={handleExitHacker} />
      )}

      {/* 5. Floating Holographic Windows */}
      {windows.map((win, idx) => (
        <Window
          key={win.id}
          win={win}
          isActive={activeWindowId === win.id}
          onFocus={() => bringToFront(win.id)}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onToggleMaximize={() => toggleMaximizeWindow(win.id)}
          isCrazyClosing={crazyPhase === 'closing-windows'}
          crazyIndex={idx}
        >
          {win.type === 'explorer' && (
            <FileExplorerWindow
              initialFolderId={win.data?.folderId || null}
              initialCategory={win.data?.category || null}
              initialSystemView={win.data?.systemView || null}
              initialUploadFiles={win.data?.uploadFiles || null}
              onPreviewFile={handlePreviewFile}
              onRefreshStorageStats={fetchStorageStats}
            />
          )}

          {win.type === 'text-saver' && <TextSaverWindow />}

          {win.type === 'wallpapers' && (
            <WallpaperGalleryWindow
              currentWallpaperType={preferences.wallpaperType}
              customWallpaperUrl={preferences.customWallpaperUrl}
              onSelectWallpaper={(type, url) => {
                const updates: Partial<UserPreferences> = {
                  wallpaperType: type,
                  customWallpaperUrl: url || '',
                };
                queuePreferenceUpdate(updates, true);
              }}
              onOpenHologramControls={() => {
                openWindow(
                  'hologram-controls',
                  'Holographic Calibration Matrix',
                  null,
                  { width: 560, height: 460 }
                );
              }}
            />
          )}

          {win.type === 'hologram-controls' && (
            <HologramControlsWindow
              opacity={preferences.hologramOpacity}
              amount={preferences.hologramAmount}
              onChangeOpacity={(val) => {
                queuePreferenceUpdate({ hologramOpacity: val });
              }}
              onChangeAmount={(val) => {
                queuePreferenceUpdate({ hologramAmount: val });
              }}
              onResetDefaults={() => {
                const resetUpdates = {
                  hologramOpacity: DEFAULT_PREFS.hologramOpacity,
                  hologramAmount: DEFAULT_PREFS.hologramAmount,
                };
                queuePreferenceUpdate(resetUpdates, true);
              }}
              onSavePreferences={() => flushSavePreferences()}
            />
          )}

          {win.type === 'personalization' && (
            <PersonalizationWindow
              preferences={preferences}
              onUpdatePreferences={(updates) => {
                const isImmediate = 'theme' in updates;
                queuePreferenceUpdate(updates, isImmediate);
              }}
              onSave={() => flushSavePreferences()}
              saveStatus={saveStatus}
              saveErrorMessage={saveErrorMessage}
              onOpenWallpapers={() => {
                openWindow('wallpapers', 'Live Wallpaper Archive', null, {
                  width: 880,
                  height: 600,
                });
              }}
              onOpenHologramControls={() => {
                openWindow(
                  'hologram-controls',
                  'Holographic Calibration Matrix',
                  null,
                  { width: 560, height: 460 }
                );
              }}
            />
          )}

          {win.type === 'storage-dashboard' && (
            <StorageDashboardWindow
              stats={storageStats}
              onRefresh={fetchStorageStats}
              onOpenExplorerTrash={() => {
                openWindow('explorer', 'Trash Bin', { systemView: 'trash' });
              }}
            />
          )}

          {win.type === 'image-viewer' && win.data && (
            <ImageViewerWindow file={win.data} />
          )}

          {win.type === 'video-player' && win.data && (
            <VideoPlayerWindow file={win.data} />
          )}

          {win.type === 'audio-player' && win.data && (
            <AudioPlayerWindow file={win.data} />
          )}

          {win.type === 'document-viewer' && win.data && (
            <DocumentViewerWindow file={win.data} />
          )}
        </Window>
      ))}

      {/* 5b. Non-intrusive HUD error toast for cloud synchronization */}
      {saveStatus === 'error' && saveErrorMessage && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            right: '24px',
            zIndex: 99999,
            background: 'rgba(239, 68, 68, 0.22)',
            border: '1px solid #ef4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.45)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '6px',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.82rem',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: '#ef4444', fontWeight: 800 }}>[HUD ALERT]</span>
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* 6. Floating Holographic Taskbar / Dock */}
      <Taskbar
        windows={windows}
        activeWindowId={activeWindowId}
        onToggleWindow={toggleTaskbarWindow}
        onOpenExplorer={() =>
          openWindow('explorer', 'Cloud File Explorer', null, { width: 880, height: 580 })
        }
        onOpenTextSaver={() =>
          openWindow('text-saver', 'Text Saver // Cloud Notepad', null, {
            width: 840,
            height: 550,
          })
        }
        onOpenWallpapers={() =>
          openWindow('wallpapers', 'Live Wallpaper Archive', null, { width: 880, height: 600 })
        }
        onOpenHologramControls={() =>
          openWindow('hologram-controls', 'Holographic Calibration Matrix', null, {
            width: 580,
            height: 500,
          })
        }
        onOpenStorage={() =>
          openWindow('storage-dashboard', 'Storage Capacity & Diagnostics', null, {
            width: 720,
            height: 600,
          })
        }
        onOpenSettings={() =>
          openWindow('personalization', 'System Personalization & Themes', null, {
            width: 700,
            height: 560,
          })
        }
        onTriggerUpload={() => {
          openWindow('explorer', 'Cloud File Explorer');
        }}
      />
    </div>
  );
}
