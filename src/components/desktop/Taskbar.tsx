'use client';

import React from 'react';
import {
  Folder,
  Sparkles,
  Sliders,
  HardDrive,
  Settings,
  Upload,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  FileCode,
} from 'lucide-react';
import { WindowState } from '@/lib/types';

interface Props {
  windows: WindowState[];
  activeWindowId: string | null;
  onToggleWindow: (id: string) => void;
  onOpenExplorer: () => void;
  onOpenTextSaver: () => void;
  onOpenWallpapers: () => void;
  onOpenHologramControls: () => void;
  onOpenStorage: () => void;
  onOpenSettings: () => void;
  onTriggerUpload: () => void;
}

export default function Taskbar({
  windows,
  activeWindowId,
  onToggleWindow,
  onOpenExplorer,
  onOpenTextSaver,
  onOpenWallpapers,
  onOpenHologramControls,
  onOpenStorage,
  onOpenSettings,
  onTriggerUpload,
}: Props) {
  const getWindowIcon = (type: WindowState['type']) => {
    switch (type) {
      case 'explorer':
        return <Folder size={18} />;
      case 'text-saver':
        return <FileCode size={18} style={{ color: '#a855f7' }} />;
      case 'image-viewer':
        return <ImageIcon size={18} />;
      case 'video-player':
        return <Film size={18} />;
      case 'audio-player':
        return <Music size={18} />;
      case 'document-viewer':
        return <FileText size={18} />;
      case 'wallpapers':
        return <Sparkles size={18} />;
      case 'hologram-controls':
        return <Sliders size={18} />;
      case 'storage-dashboard':
        return <HardDrive size={18} />;
      default:
        return <Settings size={18} />;
    }
  };

  return (
    <nav className="desktop-taskbar">
      {/* Primary App Launchers */}
      <button
        className="taskbar-btn"
        onClick={onOpenExplorer}
        title="Open File Explorer"
      >
        <Folder size={20} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onOpenTextSaver}
        title="Open Text Saver (Cloud Notepad)"
      >
        <FileCode size={20} style={{ color: '#a855f7' }} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onTriggerUpload}
        title="Upload Files to Cloud"
      >
        <Upload size={20} style={{ color: 'var(--accent-cyan)' }} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onOpenWallpapers}
        title="Live Wallpapers Gallery"
      >
        <Sparkles size={20} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onOpenHologramControls}
        title="Hologram Opacity & Amount Sliders"
      >
        <Sliders size={20} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onOpenStorage}
        title="Storage Dashboard & Diagnostics"
      >
        <HardDrive size={20} />
      </button>

      <button
        className="taskbar-btn"
        onClick={onOpenSettings}
        title="Personalization & Themes"
      >
        <Settings size={20} />
      </button>

      {/* Running Windows */}
      {windows.length > 0 && (
        <>
          <div className="taskbar-divider" />
          {windows.map((win) => {
            const isActive = activeWindowId === win.id && !win.isMinimized;
            return (
              <button
                key={win.id}
                className={`taskbar-btn ${isActive ? 'active' : ''}`}
                onClick={() => onToggleWindow(win.id)}
                title={win.title}
              >
                {getWindowIcon(win.type)}
                <div className="taskbar-btn-indicator" />
              </button>
            );
          })}
        </>
      )}
    </nav>
  );
}
