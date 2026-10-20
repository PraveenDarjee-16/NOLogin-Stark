'use client';

import React, { useEffect, useRef } from 'react';

export default function ArcReactorCanvas() {
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

    // Micro electric sparks
    interface Spark {
      angle: number;
      dist: number;
      speed: number;
      length: number;
      alpha: number;
      color: string;
    }
    const sparks: Spark[] = [];

    let rotationAngle = 0;
    let pulseT = 0;
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

      pulseT += 0.035;
      rotationAngle += 0.005;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const baseRadius = Math.min(width, height) * 0.26;

      // Dark futuristic background
      const bg = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius * 0.2,
        cx,
        cy,
        Math.max(width, height) * 0.75
      );
      bg.addColorStop(0, '#061a38');
      bg.addColorStop(0.4, '#030d1d');
      bg.addColorStop(1, '#01040a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Core plasma pulsing intensity
      const pulse = 0.85 + Math.sin(pulseT) * 0.15;

      // Central Energy Flare
      const flare = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius * 1.8
      );
      flare.addColorStop(0, `rgba(0, 240, 255, ${0.45 * pulse})`);
      flare.addColorStop(0.35, `rgba(37, 99, 235, ${0.25 * pulse})`);
      flare.addColorStop(0.7, `rgba(0, 240, 255, 0.05)`);
      flare.addColorStop(1, 'transparent');
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, width, height);

      // Outer Metallic Ring
      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Outer segmented ring with tick marks
      ctx.rotate(rotationAngle);
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI * 2) / 60;
        const isMajor = i % 5 === 0;
        const r1 = baseRadius * 1.1;
        const r2 = isMajor ? baseRadius * 1.18 : baseRadius * 1.13;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.strokeStyle = isMajor
          ? 'rgba(0, 240, 255, 0.7)'
          : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }

      // 10 Segmented Arc Reactor Copper/Magnetic Coils
      const coilCount = 10;
      for (let i = 0; i < coilCount; i++) {
        const a = (i * Math.PI * 2) / coilCount;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseRadius * 0.85);

        // Coil Block
        ctx.fillStyle = '#0f244a';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12 * pulse;
        ctx.beginPath();
        ctx.roundRect(-baseRadius * 0.14, -baseRadius * 0.1, baseRadius * 0.28, baseRadius * 0.2, 4);
        ctx.fill();
        ctx.stroke();

        // Inner glowing copper lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        for (let y = -baseRadius * 0.06; y <= baseRadius * 0.06; y += baseRadius * 0.04) {
          ctx.beginPath();
          ctx.moveTo(-baseRadius * 0.1, y);
          ctx.lineTo(baseRadius * 0.1, y);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Inner Counter-Rotating Ring
      ctx.rotate(-rotationAngle * 2.2);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Triangular Core Frame (Tony Stark / Iron Man Mark VI hallmark)
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        const x = Math.cos(a) * (baseRadius * 0.44);
        const y = Math.sin(a) * (baseRadius * 0.44);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18 * pulse;
      ctx.stroke();

      // Core Plasma Center
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.35);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#67e8f9');
      coreGrad.addColorStop(0.7, '#0284c7');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Spawn electric energy sparks (scaled for mobile/performance)
      const isMobile = window.innerWidth < 768;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const spawnChance = prefersReduced ? 0.85 : isMobile ? 0.65 : 0.4;
      if (Math.random() > spawnChance) {
        sparks.push({
          angle: Math.random() * Math.PI * 2,
          dist: baseRadius * 0.5,
          speed: prefersReduced ? 1.5 : 2 + Math.random() * 4,
          length: 8 + Math.random() * 16,
          alpha: 1,
          color: Math.random() > 0.3 ? '#00f0ff' : '#ffffff',
        });
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.dist += s.speed;
        s.alpha -= 0.03;

        if (s.alpha <= 0 || s.dist > baseRadius * 1.5) {
          sparks.splice(i, 1);
          continue;
        }

        const sx = cx + Math.cos(s.angle) * s.dist;
        const sy = cy + Math.sin(s.angle) * s.dist;
        const ex = cx + Math.cos(s.angle) * (s.dist + s.length);
        const ey = cy + Math.sin(s.angle) * (s.dist + s.length);

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
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
