'use client';

import React from 'react';
import {
  HardDrive,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Download,
  Archive,
  Trash2,
  ShieldCheck,
  Server,
  Cloud,
} from 'lucide-react';
import { StorageStats } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface Props {
  stats: StorageStats | null;
  onRefresh: () => void;
  onOpenExplorerTrash: () => void;
}

export default function StorageDashboardWindow({
  stats,
  onRefresh,
  onOpenExplorerTrash,
}: Props) {
  if (!stats) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading storage telemetry...
      </div>
    );
  }

  const categories = [
    { key: 'photos', label: 'Photos', icon: <ImageIcon size={14} />, color: '#00f0ff', data: stats.byCategory.photos },
    { key: 'videos', label: 'Videos', icon: <Film size={14} />, color: '#ef4444', data: stats.byCategory.videos },
    { key: 'documents', label: 'Documents', icon: <FileText size={14} />, color: '#38bdf8', data: stats.byCategory.documents },
    { key: 'music', label: 'Music', icon: <Music size={14} />, color: '#f59e0b', data: stats.byCategory.music },
    { key: 'downloads', label: 'Downloads', icon: <Download size={14} />, color: '#10b981', data: stats.byCategory.downloads },
    { key: 'other', label: 'Other Files', icon: <Archive size={14} />, color: '#a855f7', data: stats.byCategory.other },
    { key: 'trash', label: 'Trash Bin', icon: <Trash2 size={14} />, color: '#f43f5e', data: stats.byCategory.trash },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'rgba(3, 10, 26, 0.96)',
        padding: '24px',
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-hud)',
          paddingBottom: '14px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-hud)',
            fontSize: '1rem',
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
          }}
        >
          <HardDrive size={20} />
          <span>STORAGE CAPACITY & CLOUD DIAGNOSTICS</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.72rem',
            padding: '4px 12px',
            background: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid var(--border-hud)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <Cloud size={13} />
          <span>ENGINE: {stats.storageProvider.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Storage Gauge Card */}
      <div
        className="hologram-panel"
        style={{
          padding: '22px',
          background: 'rgba(6, 18, 44, 0.85)',
          border: '1px solid rgba(0, 240, 255, 0.22)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-hud)', letterSpacing: '0.06em' }}>
              Total Storage Allocation
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-hud)', lineHeight: 1.2, marginTop: '4px' }}>
              {formatBytes(stats.usedBytes)}{' '}
              <span style={{ fontSize: '1.05rem', color: 'var(--accent-blue)', fontWeight: 500 }}>
                / {formatBytes(stats.totalCapacityBytes)}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontFamily: 'var(--font-hud)', letterSpacing: '0.06em' }}>
              REMAINING
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {formatBytes(stats.remainingBytes)}
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div
          style={{
            height: '12px',
            minHeight: '12px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '12px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
          }}
        >
          {categories.map((c) => {
            const pct = (c.data.bytes / stats.totalCapacityBytes) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={c.key}
                style={{
                  width: `${pct}%`,
                  backgroundColor: c.color,
                  height: '100%',
                }}
                title={`${c.label}: ${formatBytes(c.data.bytes)}`}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--accent-cyan)' }}>{stats.usedPercentage}% In Use</span>
          <span>{stats.totalFiles} Files Stored in Cloud</span>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.76rem',
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          // STORAGE BREAKDOWN BY MIME CLASSIFICATION
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="hologram-panel"
              style={{
                padding: '14px',
                background: 'rgba(4, 14, 34, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: cat.color }}>{cat.icon}</div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {cat.data.count} file(s)
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {formatBytes(cat.data.bytes)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Storage Provider Integration Guide */}
      <div
        className="hologram-panel"
        style={{
          padding: '18px',
          background: stats.storageProvider === 'local' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0, 240, 255, 0.06)',
          borderColor: stats.storageProvider === 'local' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 240, 255, 0.28)',
          marginTop: 'auto',
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: stats.storageProvider === 'local' ? '#f59e0b' : 'var(--accent-cyan)',
            marginBottom: '8px',
          }}
        >
          <ShieldCheck size={16} />
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.84rem', letterSpacing: '0.06em' }}>
            {stats.storageProvider === 'local'
              ? 'VERCEL SERVERLESS NOTICE // BROWSER STORAGE ACTIVE'
              : 'CLOUD TELEMETRY // PERMANENT STORAGE ENGINE ACTIVE'}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {stats.storageProvider === 'local' ? (
            <>
              Vercel Serverless runs in stateless ephemeral containers. Your documents, notes, and custom live wallpapers are preserved in your browser&apos;s <strong>IndexedDB</strong> cache.
              <br />
              To enable <strong>permanent cloud sync across all your devices</strong>, create a free project at <strong>supabase.com</strong> and add these 3 variables in your <strong>Vercel Project Settings &gt; Environment Variables</strong>:
            </>
          ) : (
            <>
              Your Stark Personal Cloud is connected to <strong>{stats.storageProvider.toUpperCase()}</strong>. Documents, videos, and live wallpaper selections are synchronized permanently across all devices.
            </>
          )}
          <code
            style={{
              display: 'block',
              marginTop: '8px',
              background: 'rgba(2, 6, 18, 0.85)',
              border: '1px solid var(--border-hud)',
              padding: '10px 14px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              color: 'var(--accent-cyan)',
              lineHeight: '1.6',
              wordBreak: 'break-all',
            }}
          >
            SUPABASE_URL = https://your-project.supabase.co<br />
            SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...<br />
            SUPABASE_BUCKET = personal-cloud
          </code>
        </div>
      </div>
    </div>
  );
}
