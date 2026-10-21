'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal,
  ShieldAlert,
  Cpu,
  Wifi,
  Lock,
  Radio,
  Activity,
  AlertTriangle,
  X,
  Crosshair,
  Server,
} from 'lucide-react';

interface Props {
  phase: 'entrance' | 'simulation';
  onExit: () => void;
}

interface TerminalLog {
  id: number;
  text: string;
  type: 'info' | 'success' | 'warn' | 'danger' | 'cyan';
  time: string;
}

const TERMINAL_SCRIPTS: Array<{ text: string; type: TerminalLog['type'] }> = [
  { text: '[>] Initializing quantum penetration sequence against Stark Cloud Gateway...', type: 'cyan' },
  { text: '[+] Port 443 handshake intercepted. SSL/TLS fingerprint cloned.', type: 'info' },
  { text: '[!] Bypassing EDITH orbital satellite telemetry firewall...', type: 'warn' },
  { text: '[+] Injected zero-day exploit into Jarvis quantum matrix driver.', type: 'success' },
  { text: '[*] Memory segment 0x00A4F000 allocated for rootkit injection.', type: 'info' },
  { text: '[#] Altering Arc Reactor power frequency telemetry...', type: 'cyan' },
  { text: '[!] STARK KERNEL PANIC: Security sandbox breached!', type: 'danger' },
  { text: '[+] Decrypted 4,096-bit AES master cryptographic key.', type: 'success' },
  { text: '[>] Routing proxy chain across 12 distributed orbital nodes...', type: 'cyan' },
  { text: '[+] Holographic window layer permissions escalated to ROOT.', type: 'success' },
  { text: '[!] WARNING: Central reactor overload safeguards disabled.', type: 'danger' },
  { text: '[*] Extracting cloud storage telemetry metadata...', type: 'info' },
  { text: '[+] Firewall rules flushed. Port 8080 open for arbitrary shellcode.', type: 'success' },
  { text: '[>] Simulating real-time orbital satellite takeover...', type: 'cyan' },
  { text: '[#] System diagnostic override: Access Level 10 (Director Access).', type: 'warn' },
  { text: '[!] PROTOCOL OVERRIDE: Stark Industries Cloud Desktop COMPROMISED.', type: 'danger' },
  { text: '[+] Cybernetic telemetry stream locked at 14.2 Gbps.', type: 'success' },
];

export default function HackerModeOverlay({ phase, onExit }: Props) {
  const [entranceStep, setEntranceStep] = useState(0);
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [cpuFreq, setCpuFreq] = useState(5.4);
  const [breachProgress, setBreachProgress] = useState(88);
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const glitchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Exit handlers: Keyboard (Enter / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onExit]);

  // 2. Double-tap detection on touch devices
  const handleTouchEnd = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 380) {
      onExit();
    }
    lastTapRef.current = now;
  }, [onExit]);

  // 3. Entrance animation subtitle timeline (0s -> 1s -> 2.5s -> 3.8s)
  useEffect(() => {
    if (phase !== 'entrance') return;

    const t1 = setTimeout(() => setEntranceStep(1), 800);
    const t2 = setTimeout(() => setEntranceStep(2), 2000);
    const t3 = setTimeout(() => {
      setEntranceStep(3);
      setScreenGlitch(true);
      setTimeout(() => setScreenGlitch(false), 450);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  // 4. Matrix rain background animation on HTML5 Canvas
  useEffect(() => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
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

    const chars = '0123456789ABCDEF0123456789ABCDEF$#@%&*+=~';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const render = () => {
      ctx.fillStyle = 'rgba(2, 4, 10, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00f0ff';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Random highlight heads in red or white
        if (Math.random() > 0.92) {
          ctx.fillStyle = '#ef4444';
        } else if (Math.random() > 0.85) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#00f0ff';
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 5. Persistent Terminal Output Stream (Generates realistic streaming breach logs)
  useEffect(() => {
    if (phase !== 'simulation') return;

    // Seed initial logs
    const nowStr = () => new Date().toISOString().substring(11, 19);
    setLogs([
      { id: 1, text: '[!] SYSTEM OVERRIDE: HACKER TAKEOVER INITIATED', type: 'danger', time: nowStr() },
      { id: 2, text: '[+] Root shell established on 127.0.0.1:443', type: 'success', time: nowStr() },
      { id: 3, text: '[*] Intercepting all Stark Cloud Desktop packets...', type: 'info', time: nowStr() },
    ]);

    let logIdx = 0;
    const logInterval = setInterval(() => {
      const script = TERMINAL_SCRIPTS[logIdx % TERMINAL_SCRIPTS.length];
      logIdx++;
      setLogs((prev) => [
        ...prev.slice(-35), // Keep max 35 logs to prevent memory leaks
        {
          id: Date.now() + Math.random(),
          text: script.text,
          type: script.type,
          time: new Date().toISOString().substring(11, 19),
        },
      ]);
    }, 900);

    // Dynamic metrics oscillation
    const metricsInterval = setInterval(() => {
      setCpuFreq(parseFloat((5.2 + Math.random() * 0.6).toFixed(2)));
      setBreachProgress(Math.min(100, Math.round(92 + Math.random() * 8)));
    }, 1200);

    // Periodic glitch sweep every 4.5 seconds
    const glitchLoop = setInterval(() => {
      setScreenGlitch(true);
      setTimeout(() => setScreenGlitch(false), 300);
    }, 4500);

    return () => {
      clearInterval(logInterval);
      clearInterval(metricsInterval);
      clearInterval(glitchLoop);
    };
  }, [phase]);

  // Auto-scroll terminal log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="hacker-mode-overlay"
      onDoubleClick={onExit}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Hacker Mode Takeover Simulation"
    >
      {/* 1. CRT Scanlines, Vignette & Sweep Beams */}
      <div className="hacker-scanlines" />
      <div className="hacker-vignette" />
      <div className="hacker-flicker-beam" />
      <div className={`hacker-screen-glitch ${screenGlitch ? 'active-flash' : ''}`} />

      {/* 2. Matrix Code Canvas Layer */}
      <canvas ref={matrixCanvasRef} className="hacker-matrix-canvas" />

      {/* ========================================================
          PHASE A: 5-SECOND CINEMATIC HACKER ENTRANCE
          ======================================================== */}
      {phase === 'entrance' && (
        <div className="hacker-entrance-container">
          <div className="hacker-backdrop-glow" />

          {/* Mysterious Hooded Hacker Silhouette SVG Vector */}
          <div className="hacker-silhouette-wrapper">
            <svg
              className="hacker-silhouette-svg"
              viewBox="0 0 600 600"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Cyan Rim Glow Filter */}
                <filter id="hackerRimGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00f0ff" floodOpacity="0.8" />
                  <feDropShadow dx="0" dy="0" stdDeviation="20" floodColor="#ef4444" floodOpacity="0.4" />
                </filter>

                {/* Dark Fabric Gradient */}
                <linearGradient id="hoodFabric" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#08101e" />
                  <stop offset="50%" stopColor="#02050c" />
                  <stop offset="100%" stopColor="#000000" />
                </linearGradient>

                {/* Cybernetic Edge Rim Gradient */}
                <linearGradient id="rimLighting" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                </linearGradient>

                {/* Deep Facial Void Shadow */}
                <radialGradient id="faceVoid" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="85%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#030712" />
                </radialGradient>
              </defs>

              {/* Shoulders & Torso Silhouette */}
              <path
                d="M 60 600 L 120 460 C 140 410, 180 370, 240 355 L 260 350 C 275 380, 325 380, 340 350 L 360 355 C 420 370, 460 410, 480 460 L 540 600 Z"
                fill="url(#hoodFabric)"
                stroke="url(#rimLighting)"
                strokeWidth="2.5"
                filter="url(#hackerRimGlow)"
              />

              {/* Jacket Seam & Fold Highlights */}
              <path
                d="M 240 355 L 210 500 M 360 355 L 390 500 M 300 370 L 300 600"
                stroke="rgba(0, 240, 255, 0.25)"
                strokeWidth="1.5"
                fill="none"
              />

              {/* Outer Hood Contour */}
              <path
                d="M 170 340 C 150 240, 190 120, 300 100 C 410 120, 450 240, 430 340 C 410 375, 370 385, 300 385 C 230 385, 190 375, 170 340 Z"
                fill="url(#hoodFabric)"
                stroke="url(#rimLighting)"
                strokeWidth="3"
                filter="url(#hackerRimGlow)"
              />

              {/* Inner Hood Cowl Opening */}
              <path
                d="M 210 320 C 195 245, 230 155, 300 145 C 370 155, 405 245, 390 320 C 375 350, 345 360, 300 360 C 255 360, 225 350, 210 320 Z"
                fill="#000000"
                stroke="rgba(0, 240, 255, 0.45)"
                strokeWidth="1.5"
              />

              {/* Facial Impenetrable Void: Completely dark, no visible facial features, no eyes */}
              <ellipse
                cx="300"
                cy="255"
                rx="75"
                ry="95"
                fill="url(#faceVoid)"
              />

              {/* Subtle Cyan Holographic Glitch Rings inside hood void */}
              <ellipse
                cx="300"
                cy="255"
                rx="55"
                ry="75"
                fill="none"
                stroke="rgba(0, 240, 255, 0.12)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </svg>
          </div>

          {/* Entrance Subtitles & System Takeover Telemetry */}
          <div className="hacker-entrance-telemetry">
            <div className="hacker-entrance-title">
              // WARNING: SYSTEM SECURITY BREACH //
            </div>

            <div className="hacker-entrance-step">
              {entranceStep === 0 && 'INITIALIZING QUANTUM INTRUSION HANDSHAKE...'}
              {entranceStep === 1 && 'PROBING EDITH SATELLITE TELEMETRY FIREWALL... BYPASSING'}
              {entranceStep === 2 && 'APPROACHING CENTRAL SYSTEM KERNEL (ROOT PRIVILEGES SOUGHT)'}
              {entranceStep === 3 && 'BREACH ESTABLISHED: STARK CLOUD DESKTOP TAKEOVER COMPLETE'}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PHASE B: PERSISTENT HACKED-SCREEN SIMULATION
          ======================================================== */}
      {phase === 'simulation' && (
        <div className="hacker-simulation-stage">
          {/* Top Breach Bar */}
          <header className="hacker-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="hacker-status-pill">
                <AlertTriangle size={15} />
                <span>SECURITY BREACH SIMULATION</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                TARGET: STARK CLOUD MAINFRAME // ACCESS LAYER INITIALIZED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#38bdf8' }}>
                <Activity size={14} />
                <span>PROXY: 12 HOPS</span>
              </div>
              <button
                className="hacker-abort-btn"
                onClick={onExit}
                title="Exit Hacker Mode"
              >
                <X size={12} style={{ display: 'inline', marginRight: '4px' }} />
                <span>DISENGAGE</span>
              </button>
            </div>
          </header>

          {/* Left Column: Live Terminal Stream */}
          <aside className="hacker-terminal-panel">
            <div className="hacker-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} />
                <span>ROOT TERMINAL STREAM</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>LIVE</span>
            </div>

            <div ref={logContainerRef} className="hacker-terminal-log">
              {logs.map((log) => (
                <div key={log.id} className={`terminal-line ${log.type}`}>
                  <span style={{ color: '#64748b' }}>[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Center Column: Concentric Target Reticle & Holographic Lock */}
          <main className="hacker-center-display">
            <div className="hacker-reticle-container">
              <div className="hacker-reticle-ring-outer" />
              <div className="hacker-reticle-ring-mid" />
              <div className="hacker-reticle-ring-inner" />

              <div className="hacker-reticle-center-badge">
                <ShieldAlert size={36} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 10px #ef4444)' }} />
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '0.12em' }}>
                  SYSTEM OVERRIDE
                </div>
                <div style={{ fontSize: '0.72rem', color: '#00f0ff', letterSpacing: '0.08em' }}>
                  ACCESS LEVEL: ROOT / GODMODE
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                  EDITH PROTOCOLS DEACTIVATED
                </div>
              </div>
            </div>
          </main>

          {/* Right Column: Decryption Metrics & Orbital Map */}
          <aside className="hacker-metrics-panel">
            {/* Metric Card 1: Quantum Decryption */}
            <div className="hacker-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#00f0ff', fontFamily: 'var(--font-hud)' }}>
                  <Lock size={14} />
                  <span>QUANTUM DECRYPTION</span>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>
                  {breachProgress}%
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Cracking 4096-bit AES Jarvis Core keys
              </div>
              <div className="hacker-progress-bar-bg">
                <div className="hacker-progress-bar-fill" style={{ width: `${breachProgress}%` }} />
              </div>
            </div>

            {/* Metric Card 2: CPU & Memory Overclock */}
            <div className="hacker-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'var(--font-hud)' }}>
                  <Cpu size={14} />
                  <span>MAINFRAME CORES</span>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                  {cpuFreq} GHz
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                16 Neural Cores Infiltrated (98.4% Load)
              </div>
              <div className="hacker-progress-bar-bg">
                <div className="hacker-progress-bar-fill" style={{ width: '94%' }} />
              </div>
            </div>

            {/* Metric Card 3: Satellite Relay Connectivity */}
            <div className="hacker-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#00f0ff', fontFamily: 'var(--font-hud)' }}>
                  <Radio size={14} />
                  <span>ORBITAL RELAYS</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#34d399' }}>CONNECTED</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.68rem' }}>
                <div style={{ padding: '6px 2px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '4px' }}>
                  NODE-A
                </div>
                <div style={{ padding: '6px 2px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#ef4444' }}>
                  NODE-B
                </div>
                <div style={{ padding: '6px 2px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '4px' }}>
                  NODE-C
                </div>
                <div style={{ padding: '6px 2px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '4px' }}>
                  NODE-D
                </div>
              </div>
            </div>

            {/* Metric Card 4: Stark Arc Reactor Infiltration Status */}
            <div className="hacker-metric-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#ef4444', fontFamily: 'var(--font-hud)', marginBottom: '4px' }}>
                <Server size={14} />
                <span>SECURITY BREACH PROTOCOL</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.45' }}>
                Hacker simulation active. System files remain isolated & safe in local cloud storage.
              </div>
            </div>
          </aside>

          {/* Bottom Bar with Required Exit Instructions */}
          <footer className="hacker-bottom-bar">
            <div className="hacker-exit-hint">
              <Crosshair size={14} />
              <span>DOUBLE-TAP / DOUBLE-CLICK OR PRESS ENTER TO EXIT</span>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              // STARK CYBERNETICS // HACKER SIMULATION MODE v2.6 //
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
