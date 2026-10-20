'use client';

import React, { useEffect, useRef } from 'react';

export default function EdithOrbitalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Satellites orbiting in EDITH global defense grid
    const satellites = [
      { radius: 180, speed: 0.008, angle: 0, label: 'SAT-01 // TACTICAL', color: '#00f0ff' },
      { radius: 260, speed: -0.005, angle: 1.2, label: 'SAT-02 // RECON', color: '#38bdf8' },
      { radius: 340, speed: 0.0035, angle: 2.8, label: 'SAT-03 // QUANTUM', color: '#ef4444' },
      { radius: 420, speed: -0.002, angle: 4.1, label: 'SAT-04 // DEFENSE', color: '#10b981' },
    ];

    let angleSweep = 0;
    let time = 0;
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    function render() {
      if (!ctx || !canvas) return;
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep Stark stealth background
      const bg = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bg.addColorStop(0, '#06132b');
      bg.addColorStop(0.5, '#030a1c');
      bg.addColorStop(1, '#01040d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Coordinate grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = isMobile ? 60 : 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Orbital Circles
      satellites.forEach((sat) => {
        ctx.beginPath();
        ctx.arc(cx, cy, sat.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dashed ring
        ctx.beginPath();
        ctx.arc(cx, cy, sat.radius + 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Rotating Radar Sector Sweep
      if (!prefersReduced) {
        angleSweep += 0.012;
      }
      ctx.save();
      ctx.translate(cx, cy);
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 430);
      sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      sweepGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 430, angleSweep, angleSweep + 0.5);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Draw Orbiting Satellites and telemetry vectors
      satellites.forEach((sat) => {
        if (!prefersReduced) {
          sat.angle += sat.speed;
        }
        const sx = cx + Math.cos(sat.angle) * sat.radius;
        const sy = cy + Math.sin(sat.angle) * sat.radius;

        // Satellite node glow
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
        glow.addColorStop(0, sat.color);
        glow.addColorStop(0.4, 'rgba(0, 240, 255, 0.5)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Satellite core dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Target bracket
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 8, sy - 8, 16, 16);

        // Telemetry text
        if (!isMobile) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.font = '9px monospace';
          ctx.fillText(sat.label, sx + 12, sy - 4);
          ctx.fillStyle = sat.color;
          ctx.fillText(`LOC: [${Math.round(sx)}, ${Math.round(sy)}]`, sx + 12, sy + 7);
        }
      });

      // Central Globe Hologram Core
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy);
      ctx.lineTo(cx + 90, cy);
      ctx.moveTo(cx, cy - 90);
      ctx.lineTo(cx, cy + 90);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      time += 0.02;
      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
