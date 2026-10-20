'use client';

import React, { useState } from 'react';
import { Folder, FolderCheck, X, MoveRight } from 'lucide-react';
import { CloudFile, CloudFolder } from '@/lib/types';

interface Props {
  file: CloudFile;
  folders: CloudFolder[];
  onClose: () => void;
  onMove: (fileId: string, targetFolderId: string | null) => Promise<void>;
}

export default function MoveFileModal({
  file,
  folders,
  onClose,
  onMove,
}: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    file.folderId
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exclude system folders except normal ones
  const validFolders = folders.filter((f) => !f.isTrash && f.systemType !== 'trash');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onMove(file.id, selectedFolderId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2100,
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
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          background: 'rgba(6, 18, 42, 0.95)',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-hud)',
            paddingBottom: '10px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '0.9rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MoveRight size={16} />
            <span>MOVE FILE TO DESTINATION</span>
          </div>
          <button className="window-control-btn close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Select destination directory for: <strong style={{ color: '#fff' }}>{file.name}</strong>
        </div>

        {/* Directory Picker */}
        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '20px',
            padding: '4px',
          }}
        >
          <div
            className={`sidebar-folder-item ${selectedFolderId === null ? 'active' : ''}`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Folder size={16} />
            <span>[Root Cloud Drive]</span>
          </div>

          {validFolders.map((f) => (
            <div
              key={f.id}
              className={`sidebar-folder-item ${selectedFolderId === f.id ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(f.id)}
            >
              <Folder size={16} />
              <span>{f.name}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="holo-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="holo-btn primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            <FolderCheck size={14} />
            <span>{isSubmitting ? 'Moving...' : 'Confirm Move'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
