'use client';

import React, { useEffect, useRef } from 'react';

export default function SpiderManRescueCanvas() {
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

    // Atmospheric raindrops
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
    }
    const rainDrops: RainDrop[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 25,
      speed: 4 + Math.random() * 8,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    // Golden / Amber embers and cyan shockwave particles
    interface Ember {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }
    const embers: Ember[] = [];

    // Electric shockwave pulses
    interface PulseRing {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
    }
    const pulseRings: PulseRing[] = [];

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

      time += 0.015;

      // Deep emotional twilight background (golden amber + midnight electric blue)
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        40,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)'); // Warm golden core
      bgGrad.addColorStop(0.3, 'rgba(185, 28, 28, 0.18)'); // Spider red undertone
      bgGrad.addColorStop(0.65, '#071630'); // Electric TASM2 night blue
      bgGrad.addColorStop(1, '#020617'); // Dark void
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Periodically trigger emotional shockwave pulses
      if (Math.random() > 0.985) {
        pulseRings.push({
          x: width * 0.5 + (Math.random() - 0.5) * 160,
          y: height * 0.45 + (Math.random() - 0.5) * 120,
          radius: 10,
          maxRadius: 320 + Math.random() * 200,
          alpha: 0.8,
          color: Math.random() > 0.5 ? '#00f0ff' : '#f59e0b',
        });
      }

      // Draw & update pulse rings
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const ring = pulseRings[i];
        ring.radius += 3.2;
        ring.alpha -= 0.012;

        if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
          pulseRings.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Atmospheric slow-motion rain streaks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      rainDrops.forEach((d) => {
        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 3, d.y + d.length);
        ctx.stroke();
        ctx.restore();

        d.y += d.speed;
        d.x -= 0.6;
        if (d.y > height) {
          d.y = -20;
          d.x = Math.random() * width;
        }
      });

      // Spawn glowing embers (amber gold & spider red)
      if (embers.length < 90 && Math.random() > 0.3) {
        embers.push({
          x: width * 0.5 + (Math.random() - 0.5) * (width * 0.7),
          y: height * 0.6 + Math.random() * (height * 0.35),
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.6 - Math.random() * 1.8,
          size: 1.5 + Math.random() * 3,
          color:
            Math.random() > 0.4
              ? '#f59e0b'
              : Math.random() > 0.5
              ? '#ef4444'
              : '#38bdf8',
          alpha: 0.9,
          decay: 0.006 + Math.random() * 0.008,
        });
      }

      // Draw embers
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx + Math.sin(time + e.y * 0.02) * 0.5;
        e.y += e.vy;
        e.alpha -= e.decay;

        if (e.alpha <= 0 || e.y < -10) {
          embers.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = e.alpha;
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Central emotional geometric clock-tower gear / web silhouette
      ctx.save();
      ctx.translate(width * 0.5, height * 0.45);
      ctx.rotate(time * 0.15);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 40; r <= 160; r += 40) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

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
