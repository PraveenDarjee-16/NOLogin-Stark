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
  AlertCircle,
  RefreshCw,
  Film,
} from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { getClientWallpaperBlob, getClientOfflineFileBlob } from '@/lib/client-storage';

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
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localBlob, setLocalBlob] = useState<Blob | null>(null);

  // Initialize video source
  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    setIsLoading(true);
    setErrorMessage(null);

    async function initSrc() {
      // 1. Check local IndexedDB cache first
      try {
        let blob = await getClientOfflineFileBlob(file.id, file.name);
        if (!blob) {
          blob = await getClientWallpaperBlob(file.id, file.name, file.size);
        }
        if (blob && !isCancelled) {
          setLocalBlob(blob);
          objectUrl = URL.createObjectURL(blob);
          setVideoSrc(objectUrl);
          return;
        }
      } catch (err) {
        console.warn('IndexedDB blob retrieval notice:', err);
      }

      // 2. Canonical server streaming URL with HTTP 206 Partial Content range support
      if (!isCancelled) {
        const serverUrl = `/api/files/download/${encodeURIComponent(file.id)}?preview=true`;
        setVideoSrc(serverUrl);
      }
    }

    initSrc();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.storageKey, file.name, file.size]);

  const togglePlay = () => {
    if (!videoRef.current || errorMessage) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((e) => {
        console.warn('Play interrupted or waiting:', e);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
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
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleVideoError = () => {
    setIsLoading(false);
    const err = videoRef.current?.error;
    if (!err) {
      setErrorMessage(
        'Unable to load or stream video file. Please check server connection.'
      );
      return;
    }

    switch (err.code) {
      case 1: // MEDIA_ERR_ABORTED
        setErrorMessage('Video streaming was aborted by the browser.');
        break;
      case 2: // MEDIA_ERR_NETWORK
        setErrorMessage(
          'Network connection error while streaming video data from cloud server.'
        );
        break;
      case 3: // MEDIA_ERR_DECODE
        setErrorMessage(
          'Decoding error: Video stream is corrupted or the codec is not supported by your browser.'
        );
        break;
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        setErrorMessage(
          `Browser Codec Incompatibility: This browser engine cannot decode this video format or codec (${file.mimeType || 'video/mp4'}). Download the original file below to play smoothly in VLC or a desktop media player.`
        );
        break;
      default:
        setErrorMessage(
          'Failed to play video. You can download the original file to view it locally.'
        );
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (localBlob) {
        const url = URL.createObjectURL(localBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        return;
      }

      // Download from server download route
      const downloadUrl = `/api/files/download/${encodeURIComponent(file.id)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
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
        userSelect: 'none',
      }}
    >
      {/* Video Viewport / Canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={togglePlay}
      >
        {videoSrc && !errorMessage && (
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
            onCanPlay={() => setIsLoading(false)}
            onError={handleVideoError}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && !errorMessage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(1, 4, 10, 0.75)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-hud)',
              gap: '12px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '2px solid rgba(0, 240, 255, 0.2)',
                borderTopColor: 'var(--accent-cyan)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ letterSpacing: '0.1em', fontSize: '0.78rem' }}>
              BUFFERING QUANTUM STREAM // {formatBytes(file.size)}
            </div>
          </div>
        )}

        {/* Error / Codec Compatibility Overlay */}
        {errorMessage && (
          <div
            className="hologram-panel"
            style={{
              margin: '20px',
              maxWidth: '520px',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(6, 16, 38, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle size={36} style={{ color: '#ef4444' }} />
            <div
              style={{
                fontFamily: 'var(--font-hud)',
                fontSize: '0.92rem',
                color: '#fff',
                letterSpacing: '0.08em',
              }}
            >
              VIDEO PLAYBACK NOTICE // STARK TELEMETRY
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                lineHeight: '1.45',
              }}
            >
              {errorMessage}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                className="holo-btn primary"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download size={14} />
                <span>
                  {isDownloading
                    ? 'Downloading...'
                    : `Download Video File (${formatBytes(file.size)})`}
                </span>
              </button>

              <button
                className="holo-btn"
                onClick={() => {
                  setErrorMessage(null);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                <RefreshCw size={14} />
                <span>Retry Stream</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Futuristic HUD Video Controls */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(3, 10, 26, 0.96)',
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
          disabled={!!errorMessage}
          style={{
            width: '100%',
            accentColor: 'var(--accent-cyan)',
            cursor: errorMessage ? 'not-allowed' : 'pointer',
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
              disabled={!!errorMessage}
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

            <button
              className="window-control-btn"
              title={`Download Video (${formatBytes(file.size)})`}
              onClick={handleDownload}
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
