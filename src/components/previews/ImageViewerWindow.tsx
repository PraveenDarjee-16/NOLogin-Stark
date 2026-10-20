'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Info,
} from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface Props {
  file: CloudFile;
}

export default function ImageViewerWindow({ file }: Props) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const imageUrl = `/api/files/download/${file.id}?preview=true`;

  const handleZoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#010409',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Control Bar */}
      <div
        style={{
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(3, 10, 26, 0.9)',
          borderBottom: '1px solid var(--border-hud)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-hud)',
          }}
        >
          {file.name} ({formatBytes(file.size)})
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="window-control-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button className="window-control-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button className="window-control-btn" onClick={handleRotate} title="Rotate 90°">
            <RotateCw size={14} />
          </button>
          <button className="holo-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }} onClick={handleReset}>
            Reset
          </button>
          <a
            href={`/api/files/download/${file.id}`}
            download={file.name}
            className="window-control-btn"
            title="Download Original"
          >
            <Download size={14} />
          </a>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '20px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={file.name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,240,255,0.2)',
          }}
        />
      </div>
    </div>
  );
}
