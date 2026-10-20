'use client';

import React, { useEffect, useRef } from 'react';

export default function BlueHologramCanvas() {
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

    // Particle matrix
    interface NodeParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius: number;
      pulseOffset: number;
    }

    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = prefersReduced ? 16 : isMobile ? 32 : 75;
    const particles: NodeParticle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 500,
      vx: (Math.random() - 0.5) * (prefersReduced ? 0.3 : 0.8),
      vy: (Math.random() - 0.5) * (prefersReduced ? 0.3 : 0.8),
      radius: 2 + Math.random() * 2.5,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    let scanlineY = 0;
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

      time += 0.02;

      // Dark futuristic void with subtle cyan center glow
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#04132b');
      bgGrad.addColorStop(0.5, '#020b18');
      bgGrad.addColorStop(1, '#01040a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Scanning Laser Line
      scanlineY = (scanlineY + 2.5) % height;
      const laserGrad = ctx.createLinearGradient(0, scanlineY - 20, 0, scanlineY + 20);
      laserGrad.addColorStop(0, 'transparent');
      laserGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
      laserGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = laserGrad;
      ctx.fillRect(0, scanlineY - 20, width, 40);

      // Central Hologram rotating wireframe hexagon
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(time * 0.2);

      const hexRadius = 180 + Math.sin(time) * 15;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * hexRadius;
        const y = Math.sin(a) * hexRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner counter-rotating ring
      ctx.rotate(-time * 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Update & Draw Constellation Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw connections to nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.4;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw node
        const glow = 0.5 + Math.sin(time * 2 + p.pulseOffset) * 0.5;
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10 * glow;
        ctx.globalAlpha = 0.4 + glow * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
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
