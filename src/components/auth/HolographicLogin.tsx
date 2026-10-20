'use client';

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Key,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Terminal,
  Cpu,
} from 'lucide-react';

interface Props {
  onLoginSuccess: (username: string) => void;
}

export default function HolographicLogin({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Security key password is required');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'ACCESS DENIED: Invalid Security Credentials');
      } else {
        onLoginSuccess(data.username || 'admin');
      }
    } catch (err: any) {
      setErrorMsg('Failed to communicate with authentication mainframe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Holographic Grid */}
      <div className="holo-grid" style={{ opacity: 0.7 }} />

      {/* Rotating Background Reticles */}
      <div
        className="holo-rings-container"
        style={{
          width: '560px',
          height: '560px',
          opacity: 0.35,
        }}
      >
        <div className="holo-ring holo-ring-outer" />
        <div className="holo-ring holo-ring-inner" />
        <div className="holo-ring holo-ring-core" />
      </div>

      {/* Corner Telemetry Markers */}
      <div className="holo-telemetry-corner holo-corner-top-left">
        <div>// SECURE CLOUD GATEWAY v4.2</div>
        <div>JARVIS // EDITH TERMINAL INTERFACE</div>
        <div>ENCRYPTION: AES-256-GCM / RESILIENT SHA-256</div>
      </div>

      <div className="holo-telemetry-corner holo-corner-top-right">
        <div>PROTOCOL: ZERO-KNOWLEDGE PRIVATE STORAGE</div>
        <div>DEVICE_CROSS_SYNC: ACTIVE</div>
        <div>VERCEL_MANAGED_AUTHENTICATION</div>
      </div>

      {/* Main Holographic Login Panel */}
      <div
        className="hologram-panel"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '36px 32px',
          background: 'rgba(6, 18, 44, 0.85)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.35)',
          zIndex: 20,
          margin: '20px',
        }}
      >
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* Brand Header & Official Logo */}
        <div className="login-brand-header">
          <div className="login-logo-container">
            <div className="login-logo-glow-ring" />
            <div className="login-logo-reticle" />
            <div className="login-logo-badge" title="STARK // EDITH CLOUD Security Verification">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/stark-edith-emblem.png"
                alt="STARK // EDITH CLOUD Official Security Emblem"
                className="login-logo-img"
              />
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.12em',
              textShadow: '0 0 12px rgba(0, 240, 255, 0.7)',
              marginBottom: '6px',
            }}
          >
            STARK // EDITH CLOUD
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent-blue)',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
            }}
          >
            PERSONAL 3D FILE EXPLORER GATEWAY
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontFamily: 'var(--font-hud)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-hud)',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                letterSpacing: '0.06em',
              }}
            >
              ACCESS USERNAME
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="holo-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter username (default: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-cyan)',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-hud)',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                letterSpacing: '0.06em',
              }}
            >
              SECURITY ACCESS KEY (PASSWORD)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="holo-input"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              <Key
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-cyan)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                marginTop: '6px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Configurable via Vercel env: <span style={{ color: 'var(--accent-cyan)' }}>ADMIN_PASSWORD</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="holo-btn primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>VERIFYING BIOMETRICS...</span>
            ) : (
              <>
                <span>INITIALIZE CLUSTER ACCESS</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          PRIVATE SYSTEM // ACCESS RESTRICTED TO AUTHORIZED OPERATOR
        </div>
      </div>
    </div>
  );
}
