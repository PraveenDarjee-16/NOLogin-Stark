'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  opacity: number; // 0 - 100
  amount: number; // 0 - 100
  isCrazyMode?: boolean;
  crazyPhase?: 'closing-windows' | 'case2-active' | null;
}

export default function HologramOverlay({
  opacity,
  amount,
  isCrazyMode = false,
  crazyPhase = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [telemetryValues, setTelemetryValues] = useState({
    cpu: 24,
    mem: 38,
    quantum: '99.8%',
    coords: '40.7128° N, 74.0060° W',
    subsystem: 'ONLINE',
  });

  // Cycle telemetry coordinates periodically
  useEffect(() => {
    if (amount <= 10 && !isCrazyMode) return;
    const interval = setInterval(() => {
      setTelemetryValues({
        cpu: isCrazyMode ? Math.floor(82 + Math.random() * 17) : Math.floor(18 + Math.random() * 20),
        mem: isCrazyMode ? Math.floor(88 + Math.random() * 11) : Math.floor(34 + Math.random() * 15),
        quantum: crazyPhase === 'closing-windows'
          ? 'EDITH CONVERGENCE'
          : isCrazyMode
          ? '100% OVERDRIVE'
          : (99.4 + Math.random() * 0.5).toFixed(1) + '%',
        coords: `${(40.712 + Math.random() * 0.002).toFixed(4)}° N, ${(
          74.006 + Math.random() * 0.002
        ).toFixed(4)}° W`,
        subsystem: crazyPhase === 'closing-windows'
          ? 'EDITH // SYSTEM CONVERGENCE'
          : isCrazyMode
          ? 'OVERDRIVE // FULL RESONANCE'
          : 'ONLINE // SECURE',
      });
    }, isCrazyMode ? 400 : 3500);
    return () => clearInterval(interval);
  }, [amount, isCrazyMode, crazyPhase]);

  // Floating ambient particles scaled by `amount`
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || amount <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Scale particles according to device power, screen size, and reduced-motion preferences
    const isMobile = window.innerWidth < 768;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxCount = prefersReduced ? 12 : isMobile ? (isCrazyMode ? 45 : 22) : (isCrazyMode ? 140 : 60);
    const count = Math.max(6, Math.floor((amount / 100) * maxCount));

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color?: string;
      trail?: { x: number; y: number }[];
    }

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (prefersReduced ? 0.2 : 0.6),
      vy: prefersReduced ? -0.2 : -0.4 - Math.random() * 0.8,
      radius: 1 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.6,
      color: Math.random() > 0.4 ? '#00f0ff' : Math.random() > 0.5 ? '#ef4444' : '#38bdf8',
      trail: [],
    }));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    function render() {
      if (!ctx || !canvas) return;
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((p) => {
        if (crazyPhase === 'closing-windows') {
          // CASE 1: High-speed inward suction straight to reactor center
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            p.vx = (dx / dist) * (6 + Math.random() * 4);
            p.vy = (dy / dist) * (6 + Math.random() * 4);
          } else {
            p.x = cx + (Math.random() - 0.5) * 60;
            p.y = cy + (Math.random() - 0.5) * 60;
          }
        } else if (crazyPhase === 'case2-active' || isCrazyMode) {
          // CASE 2: Vortex spiral trails around the desktop
          const dx = cx - p.x;
          const dy = cy - p.y;
          const angle = Math.atan2(dy, dx) + 0.25;
          p.vx = Math.cos(angle) * (5.5 + Math.random() * 3.5) + dx * 0.025;
          p.vy = Math.sin(angle) * (5.5 + Math.random() * 3.5) + dy * 0.025;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.fillStyle = isCrazyMode
          ? p.color || '#00f0ff'
          : `rgba(0, 240, 255, ${p.alpha * (amount / 100)})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isCrazyMode ? p.radius * 1.6 : p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [amount, isCrazyMode, crazyPhase]);

  if (opacity <= 0 && !isCrazyMode) {
    return null;
  }

  const normalizedOpacity = isCrazyMode ? 0.95 : opacity / 100;
  const normalizedAmount = isCrazyMode ? 1.0 : amount / 100;

  return (
    <div
      className={`hologram-root ${isCrazyMode ? 'crazy-mode-active' : ''} ${
        crazyPhase === 'closing-windows' ? 'crazy-case1-active' : ''
      } ${crazyPhase === 'case2-active' ? 'crazy-case2-active' : ''}`}
      style={{
        opacity: normalizedOpacity,
      }}
    >
      {/* Scanlines & Digital grid */}
      <div className="holo-grid" />

      {/* CASE 2: 3D Perspective Grid Distortion Wave */}
      {crazyPhase === 'case2-active' && (
        <div className="crazy-perspective-grid holo-grid" />
      )}

      {/* Floating Particles Canvas */}
      {(amount > 0 || isCrazyMode) && (
        <canvas ref={canvasRef} className="holo-particles-canvas" />
      )}

      {/* Rotating HUD Reticle / Multiple Rings */}
      {(amount > 10 || isCrazyMode) && (
        <div
          className="holo-rings-container"
          style={{
            opacity: isCrazyMode ? 1 : normalizedAmount * 0.75,
            transform: `translate(-50%, -50%) scale(${
              isCrazyMode ? 1.2 : 0.8 + normalizedAmount * 0.2
            })`,
          }}
        >
          <div className="holo-ring holo-ring-outer" />
          <div className="holo-ring holo-ring-inner" />
          <div className="holo-ring holo-ring-core" />
        </div>
      )}

      {/* CASE 1: Electric Blue Energy Streaks Flying Inward to Central Reactor */}
      {crazyPhase === 'closing-windows' && (
        <>
          <div className="crazy-energy-streak" style={{ '--angle': '0deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '45deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '90deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '135deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '180deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '225deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '270deg' } as any} />
          <div className="crazy-energy-streak" style={{ '--angle': '315deg' } as any} />
          <div className="crazy-scan-horizontal" />
          <div className="crazy-shockwave" />
        </>
      )}

      {/* CASE 2: Spectacular 3-5s Holographic Sequence (Shockwaves, Lasers, Spider-Man Flashes) */}
      {crazyPhase === 'case2-active' && (
        <>
          <div className="crazy-shockwave" />
          <div className="crazy-shockwave crazy-shockwave-2" />
          <div className="crazy-shockwave crazy-shockwave-3" />
          <div className="crazy-shockwave crazy-shockwave-4" />
          <div className="crazy-scan-horizontal" />
          <div className="crazy-scan-horizontal crazy-scan-horizontal-2" />
          <div className="crazy-scan-diagonal" />
          <div className="crazy-spidey-flashes" />
          <div className="crazy-final-burst" />
        </>
      )}

      {/* Futuristic Corner Telemetry Data */}
      {(amount > 20 || isCrazyMode) && (
        <>
          <div
            className="holo-telemetry-corner holo-corner-top-left"
            style={{ opacity: isCrazyMode ? 1 : normalizedAmount * 0.8 }}
          >
            <div>// STARK CLOUD ARCHITECTURE v4.2</div>
            <div>STATUS: {telemetryValues.subsystem}</div>
            <div>SYS_CPU: {telemetryValues.cpu}% // MEM: {telemetryValues.mem}%</div>
          </div>

          <div
            className="holo-telemetry-corner holo-corner-top-right"
            style={{ opacity: isCrazyMode ? 1 : normalizedAmount * 0.8 }}
          >
            <div>COORDINATES: {telemetryValues.coords}</div>
            <div>QUANTUM_ENCRYPTION: {telemetryValues.quantum}</div>
            <div>SERVER: ACTIVE // AIR-GAPPED MESH</div>
          </div>

          <div
            className="holo-telemetry-corner holo-corner-bottom-left"
            style={{ opacity: isCrazyMode ? 1 : normalizedAmount * 0.8 }}
          >
            <div>[NODE.01] CLOUD_REDUNDANCY: 100%</div>
            <div>HOLO_OPACITY: {opacity}% // AMOUNT: {amount}%</div>
          </div>

          <div
            className="holo-telemetry-corner holo-corner-bottom-right"
            style={{ opacity: isCrazyMode ? 1 : normalizedAmount * 0.8 }}
          >
            <div>SECURITY: BIOMETRIC PROTOCOL VERIFIED</div>
            <div>SESSION_LIFETIME: 30D RESILIENT</div>
          </div>
        </>
      )}

      {/* Crosshairs */}
      {(amount > 35 || isCrazyMode) && (
        <>
          <div
            className="holo-crosshair"
            style={{ top: '15%', left: '12%', opacity: normalizedAmount * 0.5 }}
          />
          <div
            className="holo-crosshair"
            style={{ top: '75%', right: '14%', opacity: normalizedAmount * 0.5 }}
          />
        </>
      )}
    </div>
  );
}
