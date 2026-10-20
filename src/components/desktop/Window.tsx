'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, Copy, X, ArrowLeft } from 'lucide-react';
import { WindowState } from '@/lib/types';

interface Props {
  win: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  isCrazyClosing?: boolean;
  crazyIndex?: number;
  children: React.ReactNode;
}

export default function Window({
  win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  isCrazyClosing = false,
  crazyIndex = 0,
  children,
}: Props) {
  const windowRef = useRef<HTMLDivElement | null>(null);

  // Local position & size state for dragging/resizing
  const [pos, setPos] = useState(win.position);
  const [size, setSize] = useState(win.size);

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Titlebar drag handlers
  const handlePointerDownDrag = (e: React.PointerEvent) => {
    if (win.isMaximized || isMobile) return;
    onFocus();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newX = Math.max(10, Math.min(window.innerWidth - 100, dragStart.current.posX + dx));
    const newY = Math.max(48, Math.min(window.innerHeight - 100, dragStart.current.posY + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Resize handle handlers
  const handlePointerDownResize = (e: React.PointerEvent) => {
    if (win.isMaximized || isMobile) return;
    e.stopPropagation();
    onFocus();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizing.current) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newW = Math.max(340, resizeStart.current.w + dx);
    const newH = Math.max(260, resizeStart.current.h + dy);
    setSize({ width: newW, height: newH });
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    isResizing.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (win.isMinimized) {
    return null;
  }

  const effectiveMaximized = win.isMaximized || isMobile;

  // Center coordinates calculation for CRAZY suction animation into the Arc Reactor
  const flyStyle = React.useMemo(() => {
    if (!isCrazyClosing) return {};
    const winWidth = size.width || 600;
    const winHeight = size.height || 450;
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 450;
    const winCenterX = pos.x + winWidth / 2;
    const winCenterY = pos.y + winHeight / 2;
    const deltaX = centerX - winCenterX;
    const deltaY = centerY - winCenterY;
    const rot = ((crazyIndex ?? 0) % 2 === 0 ? 1 : -1) * (25 + ((crazyIndex ?? 0) * 20) % 50);

    return {
      '--fly-x': `${deltaX}px`,
      '--fly-y': `${deltaY}px`,
      '--stagger-delay': `${(crazyIndex ?? 0) * 0.45}s`,
      '--tilt-rot': `${rot}deg`,
    } as React.CSSProperties;
  }, [isCrazyClosing, pos, size, crazyIndex]);

  return (
    <div
      ref={windowRef}
      className={`floating-window window-animate-in ${
        isActive ? 'active-window' : ''
      } ${effectiveMaximized ? 'maximized' : ''} ${
        isCrazyClosing ? 'crazy-closing' : ''
      }`}
      style={{
        zIndex: win.zIndex,
        ...(effectiveMaximized
          ? {}
          : {
              top: `${pos.y}px`,
              left: `${pos.x}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
            }),
        ...flyStyle,
      }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      {/* Spider-Man Web & EDITH Tech Target Overlay during CRAZY window closing */}
      {isCrazyClosing && (
        <div className="edith-target-overlay">
          {/* 4 Corner Spider Web Anchors */}
          <div className="spider-web-anchor anchor-tl">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M 0 0 L 48 0" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 0 48" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 48" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 24" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 0 0 L 24 48" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 14 0 Q 10 10 0 14" stroke="#ffffff" strokeWidth="1" fill="none" />
              <path d="M 28 0 Q 18 18 0 28" stroke="rgba(0, 240, 255, 0.85)" strokeWidth="1" fill="none" />
              <path d="M 40 0 Q 26 26 0 40" stroke="#00f0ff" strokeWidth="1" fill="none" />
              <path d="M 48 0 Q 32 32 0 48" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <div className="spider-web-anchor anchor-tr">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M 0 0 L 48 0" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 0 48" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 48" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 24" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 0 0 L 24 48" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 14 0 Q 10 10 0 14" stroke="#ffffff" strokeWidth="1" fill="none" />
              <path d="M 28 0 Q 18 18 0 28" stroke="rgba(0, 240, 255, 0.85)" strokeWidth="1" fill="none" />
              <path d="M 40 0 Q 26 26 0 40" stroke="#00f0ff" strokeWidth="1" fill="none" />
              <path d="M 48 0 Q 32 32 0 48" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <div className="spider-web-anchor anchor-bl">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M 0 0 L 48 0" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 0 48" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 48" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 24" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 0 0 L 24 48" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 14 0 Q 10 10 0 14" stroke="#ffffff" strokeWidth="1" fill="none" />
              <path d="M 28 0 Q 18 18 0 28" stroke="rgba(0, 240, 255, 0.85)" strokeWidth="1" fill="none" />
              <path d="M 40 0 Q 26 26 0 40" stroke="#00f0ff" strokeWidth="1" fill="none" />
              <path d="M 48 0 Q 32 32 0 48" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <div className="spider-web-anchor anchor-br">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M 0 0 L 48 0" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 0 48" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 48" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 0 0 L 48 24" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 0 0 L 24 48" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="1" />
              <path d="M 14 0 Q 10 10 0 14" stroke="#ffffff" strokeWidth="1" fill="none" />
              <path d="M 28 0 Q 18 18 0 28" stroke="rgba(0, 240, 255, 0.85)" strokeWidth="1" fill="none" />
              <path d="M 40 0 Q 26 26 0 40" stroke="#00f0ff" strokeWidth="1" fill="none" />
              <path d="M 48 0 Q 32 32 0 48" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
            </svg>
          </div>

          {/* Central EDITH Holographic Target Reticle */}
          <div className="edith-reticle-box">
            <div className="edith-reticle-ring" />
            <div className="edith-reticle-ring-2" />
            <div className="edith-reticle-crosshair" />
            <div className="edith-reticle-text">
              <div className="edith-badge">EDITH // TARGET LOCKED</div>
              <div className="edith-subtext">WEB TENSION 100% // PULLING</div>
            </div>
          </div>

          {/* Vertical tech scanning laser */}
          <div className="edith-electric-scanner" />
        </div>
      )}

      {/* HUD Corner Accents */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Window Title Bar */}
      <div
        className="window-titlebar"
        onPointerDown={handlePointerDownDrag}
        onPointerMove={handlePointerMoveDrag}
        onPointerUp={handlePointerUpDrag}
        onDoubleClick={onToggleMaximize}
      >
        <div className="window-title-content">
          {isMobile ? (
            <button
              className="window-mobile-back-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Back to Desktop"
            >
              <ArrowLeft size={15} />
              <span>BACK</span>
            </button>
          ) : (
            <span style={{ color: 'var(--accent-cyan)' }}>//</span>
          )}
          <span className="window-title-text">{win.title}</span>
        </div>

        <div className="window-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="window-control-btn"
            onClick={onMinimize}
            title="Minimize to Dock"
          >
            <Minus size={13} />
          </button>

          {!isMobile && (
            <button
              className="window-control-btn"
              onClick={onToggleMaximize}
              title={win.isMaximized ? 'Restore' : 'Maximize'}
            >
              {win.isMaximized ? <Copy size={11} /> : <Square size={11} />}
            </button>
          )}

          <button
            className={`window-control-btn close ${isMobile ? 'mobile-close-btn' : ''}`}
            onClick={onClose}
            title="Close Window"
          >
            <X size={13} />
            {isMobile && <span style={{ marginLeft: '4px', fontSize: '0.72rem' }}>CLOSE</span>}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="window-body">{children}</div>

      {/* Resize Grip Handle */}
      {!effectiveMaximized && (
        <div
          className="window-resize-handle"
          onPointerDown={handlePointerDownResize}
          onPointerMove={handlePointerMoveResize}
          onPointerUp={handlePointerUpResize}
        />
      )}
    </div>
  );
}
