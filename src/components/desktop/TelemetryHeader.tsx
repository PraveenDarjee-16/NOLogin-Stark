'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  HardDrive,
  Cpu,
  Power,
  Settings,
  Sparkles,
  Sliders,
  Folder,
  Zap,
  Terminal,
  Fingerprint,
} from 'lucide-react';
import { StorageStats } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface Props {
  username: string;
  storageStats: StorageStats | null;
  isCrazyMode: boolean;
  onToggleCrazy: () => void;
  isHackerMode: boolean;
  onToggleHacker: () => void;
  isPraveenMode: boolean;
  onTogglePraveen: (origin: { x: number; y: number }) => void;
  onOpenSettings: () => void;
  onOpenWallpapers: () => void;
  onOpenHologramControls: () => void;
  onOpenStorage: () => void;
  onLogout: () => void;
}

export default function TelemetryHeader({
  username,
  storageStats,
  isCrazyMode,
  onToggleCrazy,
  isHackerMode,
  onToggleHacker,
  isPraveenMode,
  onTogglePraveen,
  onOpenSettings,
  onOpenWallpapers,
  onOpenHologramControls,
  onOpenStorage,
  onLogout,
}: Props) {
  const [timeStr, setTimeStr] = useState<string>('');
  const praveenBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const handlePraveenClick = () => {
    if (praveenBtnRef.current) {
      const rect = praveenBtnRef.current.getBoundingClientRect();
      onTogglePraveen({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      onTogglePraveen({
        x: typeof window !== 'undefined' ? window.innerWidth - 180 : 400,
        y: 24,
      });
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="telemetry-header">
      {/* Brand & System Status */}
      <div className="telemetry-brand">
        <div className="status-dot-pulse" />
        <span>STARK // EDITH</span>
        <div className="telemetry-status-badge">
          <Shield size={12} />
          <span>ENCRYPTED</span>
        </div>
      </div>

      {/* Storage & Hardware Metrics */}
      <div className="telemetry-metrics">
        {storageStats && (
          <button
            onClick={onOpenStorage}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
            }}
            className="telemetry-metric-item"
            title="Click to view Storage Dashboard"
          >
            <HardDrive size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>CLOUD:</span>
            <span className="telemetry-metric-value">
              {formatBytes(storageStats.usedBytes)} /{' '}
              {formatBytes(storageStats.totalCapacityBytes)}
            </span>
          </button>
        )}

        <div className="telemetry-metric-item">
          <Cpu size={13} style={{ color: 'var(--accent-blue)' }} />
          <span>ID:</span>
          <span className="telemetry-metric-value">{username.toUpperCase()}</span>
        </div>

        <div className="telemetry-metric-item">
          <span
            className="telemetry-metric-value"
            style={{ color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}
          >
            {timeStr || '00:00:00'}
          </span>
        </div>
      </div>

      {/* Quick Launch, PRAVEEN, HACKER & CRAZY Buttons & Logout Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* PRAVEEN 3D Identity Experience Button */}
        <button
          ref={praveenBtnRef}
          className={`praveen-btn ${isPraveenMode ? 'active' : ''}`}
          onClick={handlePraveenClick}
          title={
            isPraveenMode
              ? 'PRAVEEN Identity Matrix Active (Click again or press Enter to disengage)'
              : 'PRAVEEN: Cinematic 3D Identity Flight, Dynamic Typography & Hologram Reveal'
          }
          aria-label="Toggle Praveen 3D Identity Experience"
        >
          <Fingerprint
            size={13}
            style={{
              color: isPraveenMode ? '#030712' : 'var(--accent-cyan)',
              filter: isPraveenMode ? 'none' : 'drop-shadow(0 0 4px #00f0ff)',
            }}
          />
          <span>{isPraveenMode ? 'ENGAGED' : 'PRAVEEN'}</span>
          {isPraveenMode && <span className="praveen-btn-dot" />}
        </button>

        {/* HACKER Cyber Breach Simulation Button */}
        <button
          className={`hacker-btn ${isHackerMode ? 'active' : ''}`}
          onClick={onToggleHacker}
          title={
            isHackerMode
              ? 'HACKER Mode Active (Click again, press Enter, or double-click to abort simulation)'
              : 'HACKER Mode: Cinematic 5s Cyber Breach & Live System Takeover Simulation'
          }
          aria-label="Toggle Hacker Mode"
        >
          <Terminal size={13} style={{ color: isHackerMode ? '#ffffff' : 'var(--accent-cyan)' }} />
          <span>{isHackerMode ? 'BREACHED' : 'HACKER'}</span>
        </button>

        {/* CRAZY Animation Mode Button */}
        <button
          className={`crazy-btn ${isCrazyMode ? 'active' : ''}`}
          onClick={onToggleCrazy}
          title={isCrazyMode ? 'CRAZY Mode Active (Click to cancel sequence immediately)' : 'CRAZY Mode: Cinematic Window Suction / Reactor Holographic Burst'}
        >
          <Zap size={13} fill={isCrazyMode ? '#030712' : '#ffffff'} />
          <span>{isCrazyMode ? 'OVERDRIVE' : 'CRAZY'}</span>
        </button>

        <button
          onClick={onOpenWallpapers}
          className="window-control-btn"
          title="Live Wallpapers Gallery"
        >
          <Sparkles size={14} />
        </button>

        <button
          onClick={onOpenHologramControls}
          className="window-control-btn"
          title="Hologram Opacity & Amount Controls"
        >
          <Sliders size={14} />
        </button>

        <button
          onClick={onOpenSettings}
          className="window-control-btn"
          title="System Personalization"
        >
          <Settings size={14} />
        </button>

        <button
          onClick={onLogout}
          className="window-control-btn close"
          title="Terminate Session / Logout"
        >
          <Power size={14} />
        </button>
      </div>
    </header>
  );
}
