'use client';

import React, { useRef, useEffect, useState } from 'react';
import { LiveWallpaperType } from '@/lib/types';
import SpiderManCityCanvas from './SpiderManCityCanvas';
import SpiderManRescueCanvas from './SpiderManRescueCanvas';
import BlueHologramCanvas from './BlueHologramCanvas';
import ArcReactorCanvas from './ArcReactorCanvas';
import EdithOrbitalCanvas from './EdithOrbitalCanvas';
import QuantumCoreCanvas from './QuantumCoreCanvas';
import { getClientWallpaperBlob, getActiveClientWallpaperUrl } from '@/lib/client-storage';

interface Props {
  wallpaperType: LiveWallpaperType;
  customWallpaperUrl?: string;
  brightness: number;
}

export default function LiveWallpaperCanvas({
  wallpaperType,
  customWallpaperUrl,
  brightness,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    customWallpaperUrl && !customWallpaperUrl.startsWith('indexeddb://')
      ? customWallpaperUrl
      : undefined
  );
  const [mediaError, setMediaError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Resolve custom wallpaper URL (handles IndexedDB client storage & fresh Blob URLs)
  useEffect(() => {
    let isCancelled = false;
    setMediaError(false);

    async function resolve() {
      if (wallpaperType !== 'custom-video' && wallpaperType !== 'custom-image') {
        return;
      }

      if (customWallpaperUrl) {
        if (customWallpaperUrl.startsWith('indexeddb://')) {
          const id = customWallpaperUrl.replace('indexeddb://', '');
          const blob = await getClientWallpaperBlob(id);
          if (blob && !isCancelled) {
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current);
            }
            const activeUrl = URL.createObjectURL(blob);
            blobUrlRef.current = activeUrl;
            setMediaError(false);
            setResolvedUrl(activeUrl);
            return;
          }
        } else if (!isCancelled) {
          setMediaError(false);
          setResolvedUrl(customWallpaperUrl);
          return;
        }
      }

      // If no customWallpaperUrl provided or pending, check if a client-side wallpaper exists in IndexedDB
      const localUrl = await getActiveClientWallpaperUrl();
      if (localUrl && !isCancelled) {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = localUrl;
        setMediaError(false);
        setResolvedUrl(localUrl);
      }
    }

    resolve();

    return () => {
      isCancelled = true;
    };
  }, [wallpaperType, customWallpaperUrl]);

  // Cleanup object URL on unmount only
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Explicit video playback trigger when source changes
  useEffect(() => {
    const isPlayable =
      resolvedUrl &&
      (resolvedUrl.startsWith('blob:') ||
        resolvedUrl.startsWith('http') ||
        resolvedUrl.startsWith('/'));

    if (wallpaperType === 'custom-video' && videoRef.current && isPlayable) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.load();
      videoRef.current.play().catch((e) => {
        console.warn('Playback waiting for user gesture or load event:', e);
      });
    }
  }, [wallpaperType, resolvedUrl]);

  // Tab visibility: pause video when tab hidden to save battery
  useEffect(() => {
    const handleVisibility = () => {
      if (!videoRef.current) return;
      if (document.visibilityState === 'visible') {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!resolvedUrl || resolvedUrl.startsWith('indexeddb://')) return;
    console.warn('Live wallpaper video failed to play or load, falling back to dynamic shader', e);
    setMediaError(true);
  };

  const isCustom = wallpaperType === 'custom-video' || wallpaperType === 'custom-image';
  const isPlayableUrl =
    resolvedUrl &&
    (resolvedUrl.startsWith('blob:') ||
      resolvedUrl.startsWith('http') ||
      resolvedUrl.startsWith('/'));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        filter: `brightness(${brightness})`,
        transition: 'filter 0.3s ease',
      }}
    >
      {/* Dynamic built-in canvas shaders */}
      {wallpaperType === 'spiderman-city' && <SpiderManCityCanvas />}
      {wallpaperType === 'spiderman-rescue' && <SpiderManRescueCanvas />}
      {wallpaperType === 'blue-hologram' && <BlueHologramCanvas />}
      {wallpaperType === 'arc-reactor' && <ArcReactorCanvas />}
      {wallpaperType === 'edith-orbital' && <EdithOrbitalCanvas />}
      {wallpaperType === 'quantum-core' && <QuantumCoreCanvas />}

      {/* Custom Video Live Wallpaper */}
      {wallpaperType === 'custom-video' && isPlayableUrl && !mediaError && (
        <video
          ref={videoRef}
          src={resolvedUrl}
          autoPlay
          loop
          muted
          playsInline
          onError={handleVideoError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Custom Image Wallpaper */}
      {wallpaperType === 'custom-image' && isPlayableUrl && !mediaError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${resolvedUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Fallback if custom media fails on Vercel */}
      {isCustom && (mediaError || !isPlayableUrl) && <SpiderManCityCanvas />}
    </div>
  );
}
