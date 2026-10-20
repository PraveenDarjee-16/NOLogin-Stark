'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Download,
} from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface Props {
  file: CloudFile;
}

export default function VideoPlayerWindow({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const videoUrl = `/api/files/download/${file.id}?preview=true`;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (!videoRef.current) return;
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
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
        backgroundColor: '#01040a',
        position: 'relative',
      }}
    >
      {/* Video Canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          position: 'relative',
        }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Futuristic HUD Video Controls */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(3, 10, 26, 0.95)',
          borderTop: '1px solid var(--border-hud)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Timeline Slider */}
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
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="window-control-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button className="window-control-btn" onClick={toggleMute}>
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: '70px',
                accentColor: 'var(--accent-cyan)',
                height: '4px',
              }}
            />

            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Speed Options */}
            {[0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                style={{
                  background: speed === s ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                  color: speed === s ? '#fff' : 'var(--text-dim)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  padding: '2px 4px',
                  borderRadius: '3px',
                }}
              >
                {s}x
              </button>
            ))}

            <button
              className="window-control-btn"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize size={13} />
            </button>

            <a
              href={`/api/files/download/${file.id}`}
              download={file.name}
              className="window-control-btn"
              title="Download Video File"
            >
              <Download size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
