'use client';

import React, { useEffect, useState } from 'react';
import { WindowState } from '@/lib/types';

interface Props {
  windows: WindowState[];
}

export default function SpiderWebRecallOverlay({ windows }: Props) {
  const [screenSize, setScreenSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const cx = screenSize.width / 2;
  const cy = screenSize.height / 2;

  return (
    <div className="spider-web-recall-overlay">
      <svg
        className="spider-web-svg"
        viewBox={`0 0 ${screenSize.width} ${screenSize.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Cyan electric web glow filter */}
          <filter id="webGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Web line gradient */}
          <linearGradient id="webGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.95" />
          </linearGradient>

          {/* Gold Iron Spider accent gradient */}
          <linearGradient id="goldWebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Central Web Core Burst at the Arc Reactor */}
        <g className="web-center-emitter">
          <circle cx={cx} cy={cy} r="45" fill="none" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />
          <circle cx={cx} cy={cy} r="30" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6,4" />
          <circle cx={cx} cy={cy} r="15" fill="rgba(0, 240, 255, 0.4)" filter="url(#webGlow)" />
        </g>

        {/* Dynamic Electric Web Strands to Each Open Window */}
        {windows.map((win, idx) => {
          const w = win.size?.width || 560;
          const h = win.size?.height || 420;
          const x = win.position?.x ?? 100;
          const y = win.position?.y ?? 80;

          // Target points on the window
          const targetCenter = { x: x + w / 2, y: y + h / 2 };
          const pTL = { x: x + 20, y: y + 20 };
          const pTR = { x: x + w - 20, y: y + 20 };
          const pBL = { x: x + 20, y: y + h - 20 };
          const pBR = { x: x + w - 20, y: y + h - 20 };

          // Midpoints along the web for organic curving/slingshot arcs
          const midX = (cx + targetCenter.x) / 2 + (idx % 2 === 0 ? 30 : -30);
          const midY = (cy + targetCenter.y) / 2 - 25;

          const staggerDelay = idx * 0.45; // Staggered by window index

          return (
            <g
              key={win.id}
              className="spider-window-web-group"
              style={{
                animationDelay: `${staggerDelay}s`,
                '--web-stagger': `${staggerDelay}s`,
              } as React.CSSProperties}
            >
              {/* Primary heavy tensile web cord (Center line) */}
              <path
                d={`M ${cx} ${cy} Q ${midX} ${midY} ${targetCenter.x} ${targetCenter.y}`}
                className="web-strand primary-strand"
                filter="url(#webGlow)"
              />

              {/* Branching web lines to 4 window corners */}
              <line x1={cx} y1={cy} x2={pTL.x} y2={pTL.y} className="web-strand corner-strand-1" />
              <line x1={cx} y1={cy} x2={pTR.x} y2={pTR.y} className="web-strand corner-strand-2" />
              <line x1={cx} y1={cy} x2={pBL.x} y2={pBL.y} className="web-strand corner-strand-3" />
              <line x1={cx} y1={cy} x2={pBR.x} y2={pBR.y} className="web-strand corner-strand-4" />

              {/* Radial cross-web connecting arcs near window attachment point */}
              <path
                d={`M ${pTL.x} ${pTL.y} Q ${targetCenter.x} ${targetCenter.y - 30} ${pTR.x} ${pTR.y}`}
                className="web-cross-arc"
              />
              <path
                d={`M ${pTR.x} ${pTR.y} Q ${targetCenter.x + 35} ${targetCenter.y} ${pBR.x} ${pBR.y}`}
                className="web-cross-arc"
              />
              <path
                d={`M ${pBR.x} ${pBR.y} Q ${targetCenter.x} ${targetCenter.y + 30} ${pBL.x} ${pBL.y}`}
                className="web-cross-arc"
              />
              <path
                d={`M ${pBL.x} ${pBL.y} Q ${targetCenter.x - 35} ${targetCenter.y} ${pTL.x} ${pTL.y}`}
                className="web-cross-arc"
              />

              {/* High-Voltage Energy Node Pulses racing down the web */}
              <circle
                cx={targetCenter.x}
                cy={targetCenter.y}
                r="7"
                className="web-spark-node"
                fill="#ffffff"
                filter="url(#webGlow)"
              />
              <circle
                cx={pTL.x}
                cy={pTL.y}
                r="4"
                className="web-spark-node"
                fill="#00f0ff"
              />
              <circle
                cx={pTR.x}
                cy={pTR.y}
                r="4"
                className="web-spark-node"
                fill="#00f0ff"
              />
              <circle
                cx={pBL.x}
                cy={pBL.y}
                r="4"
                className="web-spark-node"
                fill="#ef4444"
              />
              <circle
                cx={pBR.x}
                cy={pBR.y}
                r="4"
                className="web-spark-node"
                fill="#ef4444"
              />

              {/* High-Tech EDITH Slingshot HUD Vector Text */}
              <g
                className="web-hud-telemetry"
                transform={`translate(${(cx + targetCenter.x) / 2 + 15}, ${(cy + targetCenter.y) / 2 - 15})`}
              >
                <rect
                  x="-6"
                  y="-14"
                  width="190"
                  height="34"
                  fill="rgba(4, 14, 34, 0.88)"
                  stroke="rgba(0, 240, 255, 0.7)"
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x="6"
                  y="2"
                  fill="#00f0ff"
                  fontSize="10"
                  fontFamily="var(--font-hud)"
                  letterSpacing="1"
                  fontWeight="bold"
                >
                  // WEB-LINE #{idx + 1} TENSION 100%
                </text>
                <text
                  x="6"
                  y="14"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.5"
                >
                  SLINGSHOT: {win.title.length > 16 ? win.title.substring(0, 16) + '...' : win.title}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
