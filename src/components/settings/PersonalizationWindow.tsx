'use client';

import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Shield,
  Check,
  Sparkles,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { ThemePreset, UserPreferences } from '@/lib/types';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onSave: () => Promise<void>;
  onOpenWallpapers: () => void;
  onOpenHologramControls: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveErrorMessage?: string | null;
}

interface ThemeItem {
  id: ThemePreset;
  name: string;
  desc: string;
  primary: string;
  secondary: string;
}

const THEMES: ThemeItem[] = [
  {
    id: 'jarvis-cyan',
    name: 'Jarvis Cyan Hologram',
    desc: 'Pure Iron Man holographic interface with electric cyan and light-blue HUD accents.',
    primary: '#00f0ff',
    secondary: '#38bdf8',
  },
  {
    id: 'spiderman-suit',
    name: 'Spider-Man Final Suit',
    desc: 'Iconic final suit styling featuring vibrant spider-red, neon web-blue, and gold highlights.',
    primary: '#ef4444',
    secondary: '#38bdf8',
  },
  {
    id: 'arc-plasma',
    name: 'Stark Arc Plasma',
    desc: 'Deep cobalt blue with warm palladium arc core glow and golden energy circuitry.',
    primary: '#06b6d4',
    secondary: '#f59e0b',
  },
  {
    id: 'edith-stealth',
    name: 'EDITH Stealth Tactical',
    desc: 'Subtle slate dark mode with ice blue and cybernetic emerald telemetry accents.',
    primary: '#10b981',
    secondary: '#3b82f6',
  },
];

export default function PersonalizationWindow({
  preferences,
  onUpdatePreferences,
  onSave,
  onOpenWallpapers,
  onOpenHologramControls,
  saveStatus = 'idle',
  saveErrorMessage = null,
}: Props) {
  const [localSaved, setLocalSaved] = useState(false);

  const handleSave = async () => {
    try {
      await onSave();
      setLocalSaved(true);
      setTimeout(() => setLocalSaved(false), 2500);
    } catch {}
  };

  const isSavedState = localSaved || saveStatus === 'saved';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'rgba(3, 10, 26, 0.96)',
        padding: '24px',
        boxSizing: 'border-box',
        gap: '16px',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-hud)',
          fontSize: '1rem',
          color: 'var(--accent-cyan)',
          letterSpacing: '0.08em',
          marginBottom: '6px',
        }}
      >
        <Palette size={20} />
        <span>DESKTOP PERSONALIZATION & HUD THEMES</span>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Configure holographic interface color matrix, wallpaper luminescence, and system presets.
      </div>

      {/* Theme Presets */}
      <div style={{ flexShrink: 0, marginBottom: '8px' }}>
        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.78rem',
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          // COLOR MATRIX THEME PRESETS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {THEMES.map((th) => {
            const isSelected = preferences.theme === th.id;
            return (
              <div
                key={th.id}
                className="hologram-panel"
                style={{
                  padding: '14px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.16)' : 'rgba(4, 14, 34, 0.65)',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-hud)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => onUpdatePreferences({ theme: th.id })}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: th.primary }} />
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: th.secondary }} />
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-hud)' }}>
                      SELECTED
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '4px' }}>
                  {th.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {th.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wallpaper Brightness */}
      <div
        className="hologram-panel"
        style={{
          padding: '20px',
          background: 'rgba(6, 18, 42, 0.85)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.92rem', color: '#fff' }}>
              Wallpaper Luminescence (Brightness)
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {Math.round(preferences.wallpaperBrightness * 100)}%
          </span>
        </div>

        <div className="holo-slider-container">
          <div className="holo-slider-row">
            <button
              type="button"
              className="holo-slider-btn"
              onClick={() => {
                const next = Math.max(0.2, Math.round((preferences.wallpaperBrightness - 0.05) * 100) / 100);
                onUpdatePreferences({ wallpaperBrightness: next });
              }}
              title="Decrease Brightness (-5%)"
            >
              -
            </button>

            <div className="holo-slider-track-wrap">
              <input
                type="range"
                className="holo-slider holo-slider-gold"
                min={0.2}
                max={1.0}
                step={0.05}
                value={preferences.wallpaperBrightness}
                onInput={(e) => onUpdatePreferences({ wallpaperBrightness: parseFloat((e.target as HTMLInputElement).value) })}
                onChange={(e) => onUpdatePreferences({ wallpaperBrightness: parseFloat((e.target as HTMLInputElement).value) })}
                style={{
                  background: `linear-gradient(to right, var(--accent-gold) 0%, var(--accent-gold) ${(preferences.wallpaperBrightness - 0.2) / 0.8 * 100}%, rgba(0,0,0,0.7) ${(preferences.wallpaperBrightness - 0.2) / 0.8 * 100}%, rgba(0,0,0,0.7) 100%)`,
                }}
              />
            </div>

            <button
              type="button"
              className="holo-slider-btn"
              onClick={() => {
                const next = Math.min(1.0, Math.round((preferences.wallpaperBrightness + 0.05) * 100) / 100);
                onUpdatePreferences({ wallpaperBrightness: next });
              }}
              title="Increase Brightness (+5%)"
            >
              +
            </button>
          </div>

          <div className="holo-presets-row">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '4px' }}>PRESETS:</span>
            {[0.3, 0.5, 0.75, 1.0].map((presetVal) => {
              const isActive = Math.abs(preferences.wallpaperBrightness - presetVal) < 0.03;
              return (
                <button
                  key={presetVal}
                  type="button"
                  className={`holo-preset-chip ${isActive ? 'active' : ''}`}
                  onClick={() => onUpdatePreferences({ wallpaperBrightness: presetVal })}
                >
                  {Math.round(presetVal * 100)}%
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Launchers to Wallpaper & Hologram Windows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', flexShrink: 0 }}>
        <button className="holo-btn" onClick={onOpenWallpapers}>
          <Sparkles size={14} />
          <span>Open Wallpaper Gallery</span>
        </button>

        <button className="holo-btn" onClick={onOpenHologramControls}>
          <Sliders size={14} />
          <span>Open Hologram Sliders</span>
        </button>
      </div>

      {/* Save Button & Status Row */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-hud)',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.05em' }}>
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--accent-gold)' }}>
              // TRANSMITTING TELEMETRY TO CLOUD...
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#ef4444' }}>
              // {saveErrorMessage || 'CLOUD SYNC UNAVAILABLE — SAVED LOCALLY'}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ color: '#10b981' }}>
              // CLOUD TELEMETRY SYNCHRONIZED
            </span>
          )}
        </div>

        <button className="holo-btn primary" onClick={handleSave}>
          {isSavedState ? <Check size={14} style={{ color: '#10b981' }} /> : <Shield size={14} />}
          <span>{isSavedState ? 'Preferences Saved to Cloud' : 'Save All Preferences'}</span>
        </button>
      </div>
    </div>
  );
}
