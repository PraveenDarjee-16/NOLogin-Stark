'use client';

import React, { useRef, useEffect } from 'react';
import { LiveWallpaperType } from '@/lib/types';
import SpiderManCityCanvas from './SpiderManCityCanvas';
import SpiderManRescueCanvas from './SpiderManRescueCanvas';
import BlueHologramCanvas from './BlueHologramCanvas';
import ArcReactorCanvas from './ArcReactorCanvas';
import EdithOrbitalCanvas from './EdithOrbitalCanvas';
import QuantumCoreCanvas from './QuantumCoreCanvas';

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
      {wallpaperType === 'spiderman-city' && <SpiderManCityCanvas />}
      {wallpaperType === 'spiderman-rescue' && <SpiderManRescueCanvas />}
      {wallpaperType === 'blue-hologram' && <BlueHologramCanvas />}
      {wallpaperType === 'arc-reactor' && <ArcReactorCanvas />}
      {wallpaperType === 'edith-orbital' && <EdithOrbitalCanvas />}
      {wallpaperType === 'quantum-core' && <QuantumCoreCanvas />}

      {wallpaperType === 'custom-video' && customWallpaperUrl && (
        <video
          ref={videoRef}
          src={customWallpaperUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {wallpaperType === 'custom-image' && customWallpaperUrl && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${customWallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
}
