'use client';

import React, { useState, useEffect } from 'react';
import HolographicLogin from '@/components/auth/HolographicLogin';
import Desktop from '@/components/desktop/Desktop';
import { Shield, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string>('admin');

  // Verify active session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
            setUsername(data.username || 'admin');
            return;
          }
        }
        setIsAuthenticated(false);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const handleLoginSuccess = (user: string) => {
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Holographic Loading Screen
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-hud)',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid var(--accent-cyan)',
            boxShadow: 'var(--glow-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'holoPulse 1.8s infinite ease-in-out',
          }}
        >
          <Shield size={28} />
        </div>
        <div style={{ letterSpacing: '0.12em', fontSize: '0.88rem' }}>
          INITIALIZING STARK CLUSTER // VERIFYING BIOMETRICS
        </div>
      </div>
    );
  }

  // Unauthenticated: Holographic Login Screen
  if (!isAuthenticated) {
    return <HolographicLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated: Futuristic 3D Desktop
  return <Desktop username={username} onLogout={handleLogout} />;
}
