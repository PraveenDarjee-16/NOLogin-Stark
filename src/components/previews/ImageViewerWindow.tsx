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
import { getClientWallpaperBlob } from '@/lib/client-storage';

interface Props {
  file: CloudFile;
}

export default function ImageViewerWindow({ file }: Props) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    const isLocal =
      file.id.startsWith('local_file_') ||
      file.id.startsWith('client_wp_') ||
      file.storageKey?.startsWith('local_');

    if (isLocal) {
      getClientWallpaperBlob(file.id, file.name, file.size).then((blob) => {
        if (blob && !isCancelled) {
          setLocalBlob(blob);
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
        }
      });
    } else {
      setImgSrc(`/api/files/download/${file.id}?preview=true`);
    }

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.storageKey, file.name, file.size]);

  const handleZoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (localBlob) {
      const url = URL.createObjectURL(localBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else {
      const link = document.createElement('a');
      link.href = `/api/files/download/${file.id}`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          <button
            className="window-control-btn"
            title="Download Original"
            onClick={handleDownload}
          >
            <Download size={14} />
          </button>
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
          src={imgSrc || undefined}
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
