'use client';

import React, { useEffect, useRef } from 'react';

export default function QuantumCoreCanvas() {
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

    // Quantum Vortex Particles
    const count = prefersReduced ? 30 : isMobile ? 60 : 120;
    const particles = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      distance: 60 + Math.random() * (Math.min(width, height) * 0.45),
      speed: (0.005 + Math.random() * 0.015) * (i % 2 === 0 ? 1 : -1),
      radialSpeed: (Math.random() - 0.5) * 0.4,
      size: 1.5 + Math.random() * 2.5,
      color: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#ef4444' : '#f59e0b',
    }));

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

      // Deep quantum realm gradient
      const bg = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bg.addColorStop(0, '#0a0d24');
      bg.addColorStop(0.4, '#040718');
      bg.addColorStop(1, '#02030a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw quantum filaments connecting neighboring particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (!prefersReduced) {
          p1.angle += p1.speed;
          p1.distance += p1.radialSpeed;
          if (p1.distance < 40 || p1.distance > Math.min(width, height) * 0.48) {
            p1.radialSpeed *= -1;
          }
        }

        const x1 = cx + Math.cos(p1.angle) * p1.distance;
        const y1 = cy + Math.sin(p1.angle) * p1.distance;

        // Particle core
        ctx.fillStyle = p1.color;
        ctx.beginPath();
        ctx.arc(x1, y1, p1.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const x2 = cx + Math.cos(p2.angle) * p2.distance;
          const y2 = cy + Math.sin(p2.angle) * p2.distance;
          const dx = x1 - x2;
          const dy = y1 - y2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle =
              p1.color === '#00f0ff'
                ? `rgba(0, 240, 255, ${0.35 * (1 - dist / 85)})`
                : `rgba(239, 68, 68, ${0.25 * (1 - dist / 85)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Central Quantum Singularity
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 45);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.85)');
      coreGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

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
