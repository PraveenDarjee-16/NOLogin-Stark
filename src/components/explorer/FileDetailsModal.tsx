'use client';

import React from 'react';
import {
  FileText,
  Download,
  Calendar,
  HardDrive,
  Tag,
  ShieldCheck,
  X,
  Eye,
  Trash2,
} from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';

interface Props {
  file: CloudFile;
  onClose: () => void;
  onPreview: (file: CloudFile) => void;
  onDownload: (file: CloudFile) => void;
  onTrash: (file: CloudFile) => void;
}

export default function FileDetailsModal({
  file,
  onClose,
  onPreview,
  onDownload,
  onTrash,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="hologram-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'rgba(8, 22, 48, 0.94)',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-hud)',
            paddingBottom: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '0.95rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Tag size={16} />
            <span>FILE TELEMETRY & METADATA</span>
          </div>
          <button className="window-control-btn close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* File Name & Type */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#fff',
              wordBreak: 'break-all',
              marginBottom: '6px',
            }}
          >
            {file.name}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-blue)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            MIME: {file.mimeType}
          </div>
        </div>

        {/* Data Rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '22px',
            background: 'rgba(2, 8, 22, 0.6)',
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(var(--accent-cyan-rgb), 0.15)',
            fontSize: '0.82rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '3px' }}>Size</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {formatBytes(file.size)}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '3px' }}>Category</div>
            <div style={{ textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
              {file.category}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '3px' }}>
              Upload Date
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
              {formatDate(file.createdAt)}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '3px' }}>Storage</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={13} />
              <span>{file.storageProvider.toUpperCase()} SECURE</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="holo-btn primary"
            style={{ flex: 1 }}
            onClick={() => {
              onClose();
              onPreview(file);
            }}
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>

          <button
            className="holo-btn"
            style={{ flex: 1 }}
            onClick={() => {
              onDownload(file);
            }}
          >
            <Download size={15} />
            <span>Download</span>
          </button>

          <button
            className="holo-btn danger"
            onClick={() => {
              onTrash(file);
              onClose();
            }}
            title="Move to Trash"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
