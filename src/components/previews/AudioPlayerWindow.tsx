'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Download } from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { getClientOfflineFileBlob } from '@/lib/client-storage';

interface Props {
  file: CloudFile;
}

export default function AudioPlayerWindow({ file }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    const isLocal =
      file.id.startsWith('local_file_') ||
      file.id.startsWith('client_wp_') ||
      file.storageKey?.startsWith('local_');

    if (isLocal) {
      getClientOfflineFileBlob(file.id, file.name).then((blob) => {
        if (blob && !isCancelled) {
          setLocalBlob(blob);
          objectUrl = URL.createObjectURL(blob);
          setAudioSrc(objectUrl);
        }
      });
    } else {
      setAudioSrc(`/api/files/download/${file.id}?preview=true`);
    }

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.storageKey, file.name]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(4, 12, 32, 0.95)',
        padding: '24px',
        justifyContent: 'space-between',
      }}
    >
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Track Info & Visualizer */}
      <div style={{ textAlign: 'center', margin: 'auto 0' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '2px solid var(--accent-cyan)',
            boxShadow: 'var(--glow-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            animation: isPlaying ? 'holoPulse 2s infinite' : 'none',
          }}
        >
          <Music size={36} />
        </div>

        <div
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '6px',
            maxWidth: '360px',
            margin: '0 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.name}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
          SIZE: {formatBytes(file.size)} // HIGH FIDELITY STREAM
        </div>

        {/* Animated Equalizer Waveform */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '5px',
            height: '42px',
            marginTop: '20px',
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => {
            const h = isPlaying ? 10 + Math.sin(i * 0.8 + currentTime * 4) * 25 : 6;
            return (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: `${Math.max(4, h)}px`,
                  background: 'var(--accent-cyan)',
                  borderRadius: '2px',
                  transition: 'height 0.15s ease',
                  opacity: 0.6 + (i % 2) * 0.4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 'auto' }}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            accentColor: 'var(--accent-cyan)',
            cursor: 'pointer',
            height: '4px',
            marginBottom: '10px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(currentTime)}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="holo-btn primary"
              style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="window-control-btn"
              title="Download Audio"
              onClick={() => {
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
              }}
            >
              <Download size={15} />
            </button>
          </div>

          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
