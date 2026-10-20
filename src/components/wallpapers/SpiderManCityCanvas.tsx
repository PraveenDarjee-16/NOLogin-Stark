'use client';

import React, { useEffect, useRef } from 'react';

export default function SpiderManCityCanvas() {
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
      generateBuildings();
    };
    window.addEventListener('resize', handleResize);

    // Buildings definition
    interface Building {
      x: number;
      width: number;
      height: number;
      color: string;
      windows: { x: number; y: number; on: boolean }[];
    }

    let buildings: Building[] = [];

    function generateBuildings() {
      buildings = [];
      let currentX = 0;
      while (currentX < width + 100) {
        const bWidth = 60 + Math.random() * 90;
        const bHeight = 180 + Math.random() * (height * 0.55);
        const windows: { x: number; y: number; on: boolean }[] = [];

        // Generate building window lights
        const rows = Math.floor(bHeight / 24);
        const cols = Math.floor(bWidth / 18);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.4) {
              windows.push({
                x: c * 18 + 8,
                y: bHeight - r * 24 - 16,
                on: Math.random() > 0.25,
              });
            }
          }
        }

        buildings.push({
          x: currentX,
          width: bWidth,
          height: bHeight,
          color: `hsl(${220 + Math.random() * 20}, 40%, ${6 + Math.random() * 6}%)`,
          windows,
        });

        currentX += bWidth - 10;
      }
    }

    generateBuildings();

    // Red & Blue web particle streaks
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      decay: number;
    }

    const particles: Particle[] = [];

    // Searchlight beams
    let searchAngle1 = 0;
    let searchAngle2 = Math.PI;

    // Spider swinging silhouette dynamics
    let swingT = 0;

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

      // Background Night Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#07132e');
      skyGrad.addColorStop(0.85, '#0f172a');
      skyGrad.addColorStop(1, '#050a16');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Searchlight beams in background
      searchAngle1 += 0.008;
      searchAngle2 -= 0.006;
      [
        { x: width * 0.25, angle: searchAngle1, color: 'rgba(56, 189, 248, 0.08)' },
        { x: width * 0.75, angle: searchAngle2, color: 'rgba(239, 68, 68, 0.06)' },
      ].forEach((light) => {
        ctx.save();
        ctx.translate(light.x, height);
        ctx.rotate(Math.sin(light.angle) * 0.45);
        const beamGrad = ctx.createLinearGradient(0, 0, 0, -height);
        beamGrad.addColorStop(0, light.color);
        beamGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(25, 0);
        ctx.lineTo(160, -height);
        ctx.lineTo(-160, -height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Draw City Skyline Buildings
      buildings.forEach((b) => {
        const topY = height - b.height;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, topY, b.width, b.height);

        // Subtle building edge neon accent
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, topY, b.width, b.height);

        // Windows
        b.windows.forEach((w) => {
          if (w.on) {
            ctx.fillStyle =
              Math.random() > 0.02
                ? 'rgba(254, 240, 138, 0.65)'
                : 'rgba(56, 189, 248, 0.85)';
            ctx.fillRect(b.x + w.x, topY + w.y, 6, 9);
          }
        });
      });

      // Spider-Man Web swing trajectory
      swingT += 0.028;
      const pivotX = width * 0.5 + Math.sin(swingT * 0.5) * (width * 0.2);
      const pivotY = height * 0.15;
      const swingRadius = height * 0.42;
      const angle = Math.sin(swingT) * 0.75; // oscillation angle
      const heroX = pivotX + Math.sin(angle) * swingRadius;
      const heroY = pivotY + Math.cos(angle) * swingRadius;

      // Draw web line
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(heroX, heroY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Web anchor flare
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.fill();

      // Spawn swinging particles (Spidey red & blue trail)
      if (Math.random() > 0.3) {
        particles.push({
          x: heroX,
          y: heroY,
          vx: (Math.random() - 0.5) * 2 - Math.cos(angle) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#ef4444' : '#00f0ff',
          alpha: 0.9,
          decay: 0.02,
        });
      }

      // Draw Spider silhouette
      ctx.save();
      ctx.translate(heroX, heroY);
      ctx.rotate(-angle * 0.6);

      // Hero Glow
      const glowGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 28);
      glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      // Hero Silhouette Body
      ctx.fillStyle = '#050b18';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(0, -18, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#050b18';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Holographic Eyes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(-3, -18, 2, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(3, -18, 2, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Update & Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
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
