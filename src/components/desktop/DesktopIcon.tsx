'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Download,
  Archive,
  Clock,
  Star,
  Trash2,
  Folder,
  FileCode,
} from 'lucide-react';

export interface DesktopShortcut {
  id: string;
  name: string;
  systemType:
    | 'documents'
    | 'photos'
    | 'videos'
    | 'music'
    | 'text-saver'
    | 'downloads'
    | 'other'
    | 'recent'
    | 'favorites'
    | 'trash';
}

interface Props {
  shortcut: DesktopShortcut;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export default function DesktopIcon({
  shortcut,
  isSelected,
  onSelect,
  onOpen,
}: Props) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: -(y / rect.height) * 16,
      y: (x / rect.width) * 16,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && e.changedTouches.length > 0) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      // Only open if the finger didn't drag/scroll (delta < 12px)
      if (dx < 12 && dy < 12) {
        onSelect();
        onOpen();
      }
    }
    touchStartRef.current = null;
  };

  // Select appropriate icon
  const renderIcon = () => {
    const size = 32;
    switch (shortcut.systemType) {
      case 'documents':
        return <FileText size={size} style={{ color: '#38bdf8' }} />;
      case 'photos':
        return <ImageIcon size={size} style={{ color: '#00f0ff' }} />;
      case 'videos':
        return <Film size={size} style={{ color: '#ef4444' }} />;
      case 'music':
        return <Music size={size} style={{ color: '#f59e0b' }} />;
      case 'text-saver':
        return <FileCode size={size} style={{ color: '#a855f7' }} />;
      case 'downloads':
        return <Download size={size} style={{ color: '#10b981' }} />;
      case 'other':
        return <Archive size={size} style={{ color: '#06b6d4' }} />;
      case 'recent':
        return <Clock size={size} style={{ color: '#60a5fa' }} />;
      case 'favorites':
        return <Star size={size} style={{ color: '#f59e0b' }} fill="#f59e0b" />;
      case 'trash':
        return <Trash2 size={size} style={{ color: 'var(--accent-red)' }} />;
      default:
        return <Folder size={size} />;
    }
  };

  return (
    <div
      className={`desktop-icon-card ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(600px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
      }}
    >
      <div className="desktop-icon-symbol">{renderIcon()}</div>
      <div className="desktop-icon-name">{shortcut.name}</div>
    </div>
  );
}
