'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Sparkles, Shield, Cpu, Activity, Fingerprint } from 'lucide-react';

interface Props {
  origin: { x: number; y: number };
  onExit: () => void;
}

interface LetterConfig {
  char: string;
  index: number;
  matClass: string;
  name: string;
  description: string;
  // Kinetic parameters
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number; // Pitch tilt of orbit plane in radians
  orbitPhase: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  // Wide flight curve frequencies
  flightFreqX: number;
  flightFreqY: number;
  flightFreqZ: number;
  flightAmpX: number;
  flightAmpY: number;
  flightAmpZ: number;
}

const LETTERS_CONFIG: LetterConfig[] = [
  {
    char: 'P',
    index: 0,
    matClass: 'mat-titanium',
    name: 'Titanium Hologram',
    description: 'Brushed titanium with cyan laser edge extrusion',
    orbitRadius: 260,
    orbitSpeed: 0.65,
    orbitInclination: 0.35,
    orbitPhase: 0,
    rotSpeedX: 0.8,
    rotSpeedY: 1.2,
    rotSpeedZ: 0.4,
    flightFreqX: 1.1,
    flightFreqY: 0.8,
    flightFreqZ: 1.4,
    flightAmpX: 380,
    flightAmpY: 260,
    flightAmpZ: 220,
  },
  {
    char: 'R',
    index: 1,
    matClass: 'mat-crimson',
    name: 'Crimson Energy Alloy',
    description: 'Dark gunmetal chrome with hot red Stark laser core',
    orbitRadius: 285,
    orbitSpeed: -0.75,
    orbitInclination: -0.42,
    orbitPhase: (Math.PI * 2) / 7,
    rotSpeedX: 1.5,
    rotSpeedY: 0.9,
    rotSpeedZ: 1.1,
    flightFreqX: 0.9,
    flightFreqY: 1.3,
    flightFreqZ: 0.7,
    flightAmpX: 420,
    flightAmpY: 300,
    flightAmpZ: 260,
  },
  {
    char: 'A',
    index: 2,
    matClass: 'mat-crystal',
    name: 'Crystal Prism',
    description: 'Refractive ice-blue prism with iridescent facets',
    orbitRadius: 310,
    orbitSpeed: 0.55,
    orbitInclination: 0.25,
    orbitPhase: ((Math.PI * 2) / 7) * 2,
    rotSpeedX: 0.7,
    rotSpeedY: 1.4,
    rotSpeedZ: 0.6,
    flightFreqX: 1.3,
    flightFreqY: 0.7,
    flightFreqZ: 1.1,
    flightAmpX: 460,
    flightAmpY: 240,
    flightAmpZ: 280,
  },
  {
    char: 'V',
    index: 3,
    matClass: 'mat-obsidian',
    name: 'Obsidian Chrome',
    description: 'Ultra-glossy black obsidian with specular violet reflection',
    orbitRadius: 330,
    orbitSpeed: -0.85,
    orbitInclination: -0.3,
    orbitPhase: ((Math.PI * 2) / 7) * 3,
    rotSpeedX: 1.2,
    rotSpeedY: 1.1,
    rotSpeedZ: 1.3,
    flightFreqX: 0.8,
    flightFreqY: 1.2,
    flightFreqZ: 1.5,
    flightAmpX: 400,
    flightAmpY: 320,
    flightAmpZ: 240,
  },
  {
    char: 'E',
    index: 4,
    matClass: 'mat-neon',
    name: 'Neon Glass',
    description: 'High-emission electric cyan neon body with laser outline',
    orbitRadius: 295,
    orbitSpeed: 0.72,
    orbitInclination: 0.45,
    orbitPhase: ((Math.PI * 2) / 7) * 4,
    rotSpeedX: 0.9,
    rotSpeedY: 1.5,
    rotSpeedZ: 0.5,
    flightFreqX: 1.2,
    flightFreqY: 0.9,
    flightFreqZ: 0.8,
    flightAmpX: 440,
    flightAmpY: 270,
    flightAmpZ: 250,
  },
  {
    char: 'E',
    index: 5,
    matClass: 'mat-gold',
    name: 'Golden Plasma Metal',
    description: 'Stark Mark-armor gold with warm incandescent plasma aura',
    orbitRadius: 320,
    orbitSpeed: -0.62,
    orbitInclination: -0.38,
    orbitPhase: ((Math.PI * 2) / 7) * 5,
    rotSpeedX: 1.1,
    rotSpeedY: 0.8,
    rotSpeedZ: 1.2,
    flightFreqX: 0.7,
    flightFreqY: 1.4,
    flightFreqZ: 1.2,
    flightAmpX: 480,
    flightAmpY: 290,
    flightAmpZ: 270,
  },
  {
    char: 'N',
    index: 6,
    matClass: 'mat-quantum',
    name: 'Quantum Alloy',
    description: 'Dual-spectrum quantum alloy with cyan and magenta split rims',
    orbitRadius: 345,
    orbitSpeed: 0.8,
    orbitInclination: 0.28,
    orbitPhase: ((Math.PI * 2) / 7) * 6,
    rotSpeedX: 1.4,
    rotSpeedY: 1.3,
    rotSpeedZ: 0.9,
    flightFreqX: 1.0,
    flightFreqY: 1.1,
    flightFreqZ: 1.3,
    flightAmpX: 450,
    flightAmpY: 310,
    flightAmpZ: 300,
  },
];

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export default function PraveenExperienceOverlay({ origin, onExit }: Props) {
  const [isExiting, setIsExiting] = useState(false);
  const [portraitLoaded, setPortraitLoaded] = useState(false);
  const [hudPhase, setHudPhase] = useState<'activating' | 'launching' | 'flight' | 'formation' | 'orbital'>('activating');
  const [portraitOpacity, setPortraitOpacity] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const letterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Kinetic Particle pool
  const particlesRef = useRef<Particle[]>([]);
  const trailsRef = useRef<Array<{ x: number; y: number }[]>>([[], [], [], [], [], [], []]);

  // Handle smooth exit
  const triggerExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onExit();
    }, 450);
  }, [isExiting, onExit]);

  // Global Keyboard listener: ENTER or ESCAPE triggers instant clean exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [triggerExit]);

  // Mouse move parallax listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - centerX) / centerX;
      mouseRef.current.targetY = (e.clientY - centerY) / centerY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main 3D Animation Engine Loop
  useEffect(() => {
    startTimeRef.current = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial shockwave particles from the button origin
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        x: origin.x,
        y: origin.y,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 4,
        color: Math.random() > 0.4 ? '#00f0ff' : '#a855f7',
        size: 1.5 + Math.random() * 3,
        alpha: 0.9,
        maxLife: 60 + Math.random() * 40,
        life: 0,
      });
    }

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000; // seconds

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const screenCenterX = width / 2;
      const screenCenterY = height / 2;

      // Update Phase State for HUD
      if (elapsed < 0.7) {
        setHudPhase('activating');
      } else if (elapsed < 2.0) {
        setHudPhase('launching');
      } else if (elapsed < 4.5) {
        setHudPhase('flight');
      } else if (elapsed < 6.0) {
        setHudPhase('formation');
      } else {
        setHudPhase('orbital');
      }

      // Portrait fade-in logic (emerges around 4.8s to 6.0s)
      if (elapsed >= 4.6 && elapsed <= 6.2) {
        const pProgress = (elapsed - 4.6) / 1.6;
        setPortraitOpacity(Math.min(1, pProgress));
      } else if (elapsed > 6.2) {
        setPortraitOpacity(1);
      }

      // ----------------------------------------------------
      // 1. CLEAR & RENDER CANVAS (Cyber Grid, Particle Trails)
      // ----------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Faint futuristic perspective grid on floor
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
      ctx.lineWidth = 1;
      const gridY = screenCenterY + 220;
      for (let x = -width; x < width * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(screenCenterX + (x - screenCenterX) * 0.1, gridY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = gridY; y < height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Opening activation shockwaves from button origin (0s - 1.2s)
      if (elapsed < 1.4) {
        const ringRadius = elapsed * 380;
        const ringAlpha = Math.max(0, 1 - elapsed / 1.4);
        ctx.save();
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(origin.x, origin.y, ringRadius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${ringAlpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // ----------------------------------------------------
      // 2. CHOREOGRAPH EACH OF THE 7 3D LETTERS
      // ----------------------------------------------------
      LETTERS_CONFIG.forEach((cfg, i) => {
        const el = letterRefs.current[i];
        if (!el) return;

        let posX = origin.x;
        let posY = origin.y;
        let posZ = 0;
        let rotX = 0;
        let rotY = 0;
        let rotZ = 0;
        let scale = 1;
        let opacity = 0;

        const launchTime = 0.7 + i * 0.18;

        if (elapsed < launchTime) {
          // Pre-launch: letter is hidden at the button
          opacity = 0;
          scale = 0.1;
          posX = origin.x;
          posY = origin.y;
        } else if (elapsed >= launchTime && elapsed < 2.0) {
          // ----------------------------------------------------
          // LAUNCH STAGE (0.7s - 2.0s): Burst escape from button
          // ----------------------------------------------------
          const launchProgress = (elapsed - launchTime) / (2.0 - launchTime);
          // Rapid cubic expansion
          const easeOut = 1 - Math.pow(1 - launchProgress, 3);

          opacity = Math.min(1, launchProgress * 2.5);
          scale = 0.3 + easeOut * 0.9;

          // Target point in screen space to fly towards initially
          const outwardAngle = (Math.PI / 4) + (i / 6) * (Math.PI * 1.5) + cfg.orbitPhase;
          const burstDist = 280 + i * 45;
          const targetBurstX = origin.x + Math.cos(outwardAngle) * burstDist;
          const targetBurstY = origin.y + Math.sin(outwardAngle) * burstDist;

          posX = origin.x + (targetBurstX - origin.x) * easeOut;
          posY = origin.y + (targetBurstY - origin.y) * easeOut;
          posZ = easeOut * 180;

          rotX = launchProgress * 360 * cfg.rotSpeedX;
          rotY = launchProgress * 420 * cfg.rotSpeedY;
          rotZ = launchProgress * 180 * cfg.rotSpeedZ;

          // Emit particles on launch
          if (Math.random() > 0.4) {
            particlesRef.current.push({
              x: posX,
              y: posY,
              z: posZ,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              vz: (Math.random() - 0.5) * 4,
              color: i % 2 === 0 ? '#00f0ff' : '#f59e0b',
              size: 2 + Math.random() * 2,
              alpha: 0.9,
              maxLife: 35,
              life: 0,
            });
          }
        } else if (elapsed >= 2.0 && elapsed < 4.5) {
          // ----------------------------------------------------
          // FLIGHT STAGE (2.0s - 4.5s): Sweeping 3D paths
          // ----------------------------------------------------
          const flightTime = elapsed - 2.0;
          opacity = 1;
          scale = 1;

          // Multi-harmonic 3D Lissajous curve
          const angleX = flightTime * cfg.flightFreqX + cfg.orbitPhase;
          const angleY = flightTime * cfg.flightFreqY + cfg.orbitPhase * 1.3;
          const angleZ = flightTime * cfg.flightFreqZ + cfg.orbitPhase * 0.7;

          posX = screenCenterX + Math.sin(angleX) * cfg.flightAmpX;
          posY = screenCenterY + Math.cos(angleY) * cfg.flightAmpY;
          posZ = Math.sin(angleZ) * cfg.flightAmpZ;

          rotX = flightTime * 140 * cfg.rotSpeedX;
          rotY = flightTime * 180 * cfg.rotSpeedY;
          rotZ = flightTime * 90 * cfg.rotSpeedZ;
        } else if (elapsed >= 4.5 && elapsed < 6.0) {
          // ----------------------------------------------------
          // CONVERGENCE STAGE (4.5s - 6.0s): Form into 3D name
          // ----------------------------------------------------
          const convProgress = (elapsed - 4.5) / 1.5;
          const easeInOut =
            convProgress < 0.5
              ? 2 * convProgress * convProgress
              : 1 - Math.pow(-2 * convProgress + 2, 2) / 2;

          opacity = 1;

          // End of flight position
          const flightTime = 2.5;
          const lastFlightX = screenCenterX + Math.sin(flightTime * cfg.flightFreqX + cfg.orbitPhase) * cfg.flightAmpX;
          const lastFlightY = screenCenterY + Math.cos(flightTime * cfg.flightFreqY + cfg.orbitPhase * 1.3) * cfg.flightAmpY;
          const lastFlightZ = Math.sin(flightTime * cfg.flightFreqZ + cfg.orbitPhase * 0.7) * cfg.flightAmpZ;

          // Aligned Name Formation Target (Arc layout across equator)
          const letterSpacing = width < 768 ? 48 : 82;
          const targetFormX = screenCenterX + (i - 3) * letterSpacing;
          const targetFormY = screenCenterY + (width < 768 ? 160 : 190); // Positioned elegantly below the central portrait
          const targetFormZ = -Math.abs(i - 3) * 22; // Curving backward slightly like a panoramic 3D ribbon

          posX = lastFlightX + (targetFormX - lastFlightX) * easeInOut;
          posY = lastFlightY + (targetFormY - lastFlightY) * easeInOut;
          posZ = lastFlightZ + (targetFormZ - lastFlightZ) * easeInOut;

          // Align rotation to face forward with subtle 3D angle
          const targetRotY = (i - 3) * -7;
          rotX = (1 - easeInOut) * 120;
          rotY = targetRotY * easeInOut + (1 - easeInOut) * 180;
          rotZ = (1 - easeInOut) * 45;
        } else {
          // ----------------------------------------------------
          // CONTINUOUS 3D ORBITAL NAME STAGE (6.0s+ indefinitely)
          // Features periodic harmonized readable alignment every 10s!
          // ----------------------------------------------------
          opacity = 1;
          const orbitTime = elapsed - 6.0;
          const cycleDuration = 10; // 10 second choreographic cycle
          const cyclePhase = orbitTime % cycleDuration;

          // Letter spacing for aligned layout
          const letterSpacing = width < 768 ? 46 : 80;
          const alignedX = screenCenterX + (i - 3) * letterSpacing;
          const alignedY = screenCenterY + (width < 768 ? 160 : 190);
          const alignedZ = -Math.abs(i - 3) * 18;

          // Calculate 3D Elliptical Orbit
          const currentOrbitAngle = orbitTime * cfg.orbitSpeed + cfg.orbitPhase;
          const rawOrbitX = Math.cos(currentOrbitAngle) * cfg.orbitRadius;
          const rawOrbitY = Math.sin(currentOrbitAngle) * (cfg.orbitRadius * 0.55);
          // Apply 3D orbital plane inclination tilt
          const inclinedY = rawOrbitY * Math.cos(cfg.orbitInclination) - Math.sin(currentOrbitAngle) * 70 * Math.sin(cfg.orbitInclination);
          const inclinedZ = rawOrbitY * Math.sin(cfg.orbitInclination) + Math.sin(currentOrbitAngle) * 140;

          const freeOrbitX = screenCenterX + rawOrbitX;
          const freeOrbitY = screenCenterY + inclinedY;
          const freeOrbitZ = inclinedZ;

          // Alignment window: between 7.0s and 9.5s of every 10s cycle,
          // letters smoothly converge into the readable PRAVEEN name, hold, then separate!
          let alignFactor = 0;
          if (cyclePhase > 6.5 && cyclePhase < 9.5) {
            if (cyclePhase < 7.5) {
              // Transition in
              alignFactor = (cyclePhase - 6.5) / 1.0;
            } else if (cyclePhase < 8.5) {
              // Hold aligned
              alignFactor = 1;
            } else {
              // Transition out
              alignFactor = 1 - (cyclePhase - 8.5) / 1.0;
            }
          }

          // Smooth interpolation between free orbit & readable alignment
          posX = freeOrbitX * (1 - alignFactor) + alignedX * alignFactor;
          posY = freeOrbitY * (1 - alignFactor) + alignedY * alignFactor;
          posZ = freeOrbitZ * (1 - alignFactor) + alignedZ * alignFactor;

          // Individual tumble + Alignment lock
          const freeRotX = orbitTime * 65 * cfg.rotSpeedX;
          const freeRotY = (currentOrbitAngle * (180 / Math.PI)) + orbitTime * 45 * cfg.rotSpeedY;
          const freeRotZ = Math.sin(orbitTime + i) * 25;

          const alignedRotX = 0;
          const alignedRotY = (i - 3) * -6;
          const alignedRotZ = 0;

          rotX = freeRotX * (1 - alignFactor) + alignedRotX * alignFactor;
          rotY = freeRotY * (1 - alignFactor) + alignedRotY * alignFactor;
          rotZ = freeRotZ * (1 - alignFactor) + alignedRotZ * alignFactor;
        }

        // Apply Mouse Parallax
        const parallaxX = mouseRef.current.x * 35;
        const parallaxY = mouseRef.current.y * 25;

        // Apply 3D CSS Transforms directly
        el.style.transform = `translate3d(${posX + parallaxX - 36}px, ${posY + parallaxY - 45}px, ${posZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;
        el.style.opacity = opacity.toString();

        // ----------------------------------------------------
        // Record trail coordinates for canvas glow ribbon
        // ----------------------------------------------------
        if (opacity > 0.3) {
          const trail = trailsRef.current[i];
          trail.push({ x: posX + parallaxX, y: posY + parallaxY });
          if (trail.length > 14) trail.shift();
        }
      });

      // ----------------------------------------------------
      // 3. DRAW LUMINOUS PARTICLE TRAILS FOR EACH LETTER
      // ----------------------------------------------------
      ctx.save();
      trailsRef.current.forEach((trail, i) => {
        if (trail.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let t = 1; t < trail.length; t++) {
          ctx.lineTo(trail[t].x, trail[t].y);
        }
        ctx.strokeStyle =
          i === 1 ? 'rgba(239, 68, 68, 0.45)' :
          i === 5 ? 'rgba(245, 158, 11, 0.45)' :
          i === 3 ? 'rgba(168, 85, 247, 0.45)' :
          'rgba(0, 240, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.shadowColor = i === 1 ? '#ef4444' : '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
      });
      ctx.restore();

      // ----------------------------------------------------
      // 4. UPDATE & DRAW KINETIC AMBIENT PARTICLES
      // ----------------------------------------------------
      ctx.save();
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const p = particlesRef.current[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const currentAlpha = p.alpha * (1 - p.life / p.maxLife);
        if (p.life >= p.maxLife || currentAlpha <= 0) {
          particlesRef.current.splice(pIdx, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      // Periodic floating energy motes spawn around central portrait
      if (elapsed > 4.5 && Math.random() > 0.6) {
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = 120 + Math.random() * 90;
        particlesRef.current.push({
          x: screenCenterX + Math.cos(pAngle) * pDist,
          y: screenCenterY + Math.sin(pAngle) * pDist,
          z: (Math.random() - 0.5) * 60,
          vx: Math.cos(pAngle) * 0.8,
          vy: Math.sin(pAngle) * 0.8,
          vz: (Math.random() - 0.5) * 2,
          color: Math.random() > 0.5 ? '#00f0ff' : '#f59e0b',
          size: 1 + Math.random() * 2,
          alpha: 0.8,
          maxLife: 50 + Math.random() * 30,
          life: 0,
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [origin]);

  return (
    <div
      className={`praveen-overlay ${isExiting ? 'exiting' : ''}`}
      onClick={(e) => {
        // Clicking backdrop triggers exit
        if (e.target === e.currentTarget) {
          triggerExit();
        }
      }}
    >
      {/* Background Kinetic Canvas */}
      <canvas ref={canvasRef} className="praveen-canvas" />

      {/* Top HUD Telemetry Ribbon */}
      <header className="praveen-top-hud">
        <div className="praveen-top-pill">
          <Fingerprint size={13} style={{ color: '#00f0ff' }} />
          <span>STARK IDENTITY PROTOCOL // PRAVEEN 3D MATRIX</span>
        </div>
        <div className="praveen-top-pill" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <Activity size={13} style={{ color: '#f59e0b' }} />
          <span>PHASE: {hudPhase.toUpperCase()}</span>
        </div>
        <div className="praveen-top-pill">
          <Cpu size={13} style={{ color: '#38bdf8' }} />
          <span>CORE: QUANTUM EDITH V8.4</span>
        </div>
      </header>

      {/* 3D Scene Stage (Container for all 7 extruded letters) */}
      <div className="praveen-scene-stage">
        {LETTERS_CONFIG.map((cfg, idx) => (
          <div
            key={cfg.index}
            ref={(el) => {
              letterRefs.current[idx] = el;
            }}
            className={`praveen-3d-letter ${cfg.matClass}`}
            style={{ opacity: 0 }}
          >
            <div className="letter-3d-wrapper">
              {/* Back Face Shadow Layer */}
              <div
                className="letter-slice letter-back"
                style={{ transform: 'translateZ(-14px)' }}
              >
                {cfg.char}
              </div>

              {/* 3D Extrusion Depth Slices */}
              <div
                className="letter-slice letter-slice-depth"
                style={{ transform: 'translateZ(-10px)' }}
              >
                {cfg.char}
              </div>
              <div
                className="letter-slice letter-slice-depth"
                style={{ transform: 'translateZ(-6px)' }}
              >
                {cfg.char}
              </div>
              <div
                className="letter-slice letter-slice-depth"
                style={{ transform: 'translateZ(-2px)' }}
              >
                {cfg.char}
              </div>
              <div
                className="letter-slice letter-slice-depth"
                style={{ transform: 'translateZ(2px)' }}
              >
                {cfg.char}
              </div>
              <div
                className="letter-slice letter-slice-depth"
                style={{ transform: 'translateZ(6px)' }}
              >
                {cfg.char}
              </div>

              {/* Front Face with Distinct Material Shader */}
              <div
                className="letter-slice letter-front"
                style={{ transform: 'translateZ(10px)' }}
              >
                {cfg.char}
              </div>
            </div>
          </div>
        ))}

        {/* Central Identity Holographic Medallion & Portrait */}
        <div
          className="praveen-portrait-anchor"
          style={{
            opacity: portraitOpacity,
            transform: `translate(-50%, -50%) scale(${0.7 + portraitOpacity * 0.3})`,
            transition: 'transform 0.4s ease-out',
          }}
        >
          <div className="portrait-medallion-container">
            {/* Concentric Rotating HUD Reticles */}
            <div className="hud-reticle-outer" />
            <div className="hud-reticle-mid" />
            <div className="hud-reticle-inner" />

            {/* Glowing Hexagonal / Circular Shield containing the real photo */}
            <div className="portrait-shield">
              {/* Laser Scanner Bar */}
              <div className="portrait-laser-sweep" />

              <img
                src="/images/praveen-identity.jpg"
                alt="Praveen - Iron Spider Identity"
                className="portrait-image"
                onLoad={() => setPortraitLoaded(true)}
                onError={(e) => {
                  console.warn('Portrait image load fallback:', e);
                  // Fallback: If image fails, keep readable placeholder
                  e.currentTarget.src = '/icon-512.png';
                }}
              />
            </div>
          </div>

          {/* Biometric Telemetry Badge Below Portrait */}
          <div className="portrait-telemetry-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={12} style={{ color: '#00f0ff' }} />
              <span>SUBJECT: PRAVEEN // CLEARANCE: LEVEL 10</span>
            </div>
            <div className="portrait-telemetry-sub">
              BIOMETRIC SCAN: VERIFIED // SUIT: IRON SPIDER MK-IV
            </div>
          </div>
        </div>
      </div>

      {/* Exit HUD Pill at Bottom Center */}
      <footer className="praveen-exit-hud">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="praveen-btn-dot" />
          <span>PRESS <strong>ENTER</strong> OR <strong>ESC</strong> TO EXIT</span>
        </div>
        <button
          onClick={triggerExit}
          className="praveen-exit-btn"
          title="Exit 3D Identity Experience"
        >
          <X size={12} />
          <span>DISENGAGE</span>
        </button>
      </footer>
    </div>
  );
}
