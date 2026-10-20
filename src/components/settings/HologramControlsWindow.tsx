'use client';

import React, { useState } from 'react';
import { Sliders, RotateCcw, Check, Sparkles, Eye, Shield } from 'lucide-react';

interface Props {
  opacity: number;
  amount: number;
  onChangeOpacity: (val: number) => void;
  onChangeAmount: (val: number) => void;
  onResetDefaults: () => void;
  onSavePreferences: () => Promise<void>;
}

export default function HologramControlsWindow({
  opacity,
  amount,
  onChangeOpacity,
  onChangeAmount,
  onResetDefaults,
  onSavePreferences,
}: Props) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    await onSavePreferences();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'rgba(4, 12, 30, 0.96)',
        padding: '24px',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        gap: '20px',
      }}
    >
      <div>
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
          <Sliders size={20} />
          <span>HOLOGRAPHIC CALIBRATION MATRIX</span>
        </div>

        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '26px',
            lineHeight: '1.45',
          }}
        >
          Adjust the visual intensity of the Stark / EDITH HUD overlay and holographic particle density. Sliders react immediately in real-time.
        </div>

        {/* Slider 1: Hologram Opacity */}
        <div
          className="hologram-panel"
          style={{
            padding: '20px',
            marginBottom: '18px',
            background: 'rgba(6, 18, 42, 0.85)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-hud)',
                  fontSize: '0.92rem',
                  color: '#fff',
                }}
              >
                Hologram Opacity
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
              }}
            >
              {opacity}%
            </span>
          </div>

          <div className="holo-slider-container">
            <div className="holo-slider-row">
              <button
                type="button"
                className="holo-slider-btn"
                onClick={() => onChangeOpacity(Math.max(0, opacity - 5))}
                title="Decrease Opacity (-5%)"
              >
                -
              </button>

              <div className="holo-slider-track-wrap">
                <input
                  type="range"
                  className="holo-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={opacity}
                  onInput={(e) => onChangeOpacity(parseInt((e.target as HTMLInputElement).value, 10))}
                  onChange={(e) => onChangeOpacity(parseInt((e.target as HTMLInputElement).value, 10))}
                  style={{
                    background: `linear-gradient(to right, var(--accent-cyan) 0%, var(--accent-cyan) ${opacity}%, rgba(0,0,0,0.7) ${opacity}%, rgba(0,0,0,0.7) 100%)`,
                  }}
                />
              </div>

              <button
                type="button"
                className="holo-slider-btn"
                onClick={() => onChangeOpacity(Math.min(100, opacity + 5))}
                title="Increase Opacity (+5%)"
              >
                +
              </button>
            </div>

            <div className="holo-presets-row">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '4px' }}>PRESETS:</span>
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`holo-preset-chip ${opacity === val ? 'active' : ''}`}
                  onClick={() => onChangeOpacity(val)}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slider 2: Hologram Amount */}
        <div
          className="hologram-panel"
          style={{
            padding: '20px',
            marginBottom: '20px',
            background: 'rgba(6, 18, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-hud)',
                  fontSize: '0.92rem',
                  color: '#fff',
                }}
              >
                Hologram Amount & Particles
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--accent-blue)',
              }}
            >
              {amount}%
            </span>
          </div>

          <div className="holo-slider-container">
            <div className="holo-slider-row">
              <button
                type="button"
                className="holo-slider-btn"
                onClick={() => onChangeAmount(Math.max(0, amount - 5))}
                title="Decrease Amount (-5%)"
              >
                -
              </button>

              <div className="holo-slider-track-wrap">
                <input
                  type="range"
                  className="holo-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={amount}
                  onInput={(e) => onChangeAmount(parseInt((e.target as HTMLInputElement).value, 10))}
                  onChange={(e) => onChangeAmount(parseInt((e.target as HTMLInputElement).value, 10))}
                  style={{
                    background: `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${amount}%, rgba(0,0,0,0.7) ${amount}%, rgba(0,0,0,0.7) 100%)`,
                  }}
                />
              </div>

              <button
                type="button"
                className="holo-slider-btn"
                onClick={() => onChangeAmount(Math.min(100, amount + 5))}
                title="Increase Amount (+5%)"
              >
                +
              </button>
            </div>

            <div className="holo-presets-row">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '4px' }}>PRESETS:</span>
              {[0, 25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`holo-preset-chip ${amount === val ? 'active' : ''}`}
                  onClick={() => onChangeAmount(val)}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-hud)',
        }}
      >
        <button className="holo-btn danger" onClick={onResetDefaults}>
          <RotateCcw size={14} />
          <span>Reset to Default</span>
        </button>

        <button className="holo-btn primary" onClick={handleSave}>
          {isSaved ? <Check size={14} style={{ color: '#10b981' }} /> : <Shield size={14} />}
          <span>{isSaved ? 'Preferences Synced' : 'Save to Cloud Account'}</span>
        </button>
      </div>
    </div>
  );
}
