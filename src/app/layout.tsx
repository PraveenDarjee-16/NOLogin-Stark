import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/desktop.css';
import '@/styles/hologram.css';
import '@/styles/windows.css';
import '@/styles/explorer.css';
import '@/styles/hacker.css';

export const metadata: Metadata = {
  title: 'Stark Cloud Desktop // Futuristic 3D File Explorer',
  description:
    'Secure personal cloud storage desktop interface inspired by Iron Man and Spider-Man. Holographic file explorer, live dynamic wallpapers, and encrypted file access from any device.',
  keywords: [
    'personal cloud storage',
    '3d file explorer',
    'holographic desktop',
    'spiderman theme',
    'iron man stark os',
    'cloud drive',
  ],
  authors: [{ name: 'Stark Industries Security Architecture' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
      </head>
      <body>
        <div className="scanlines-overlay" />
        <div className="hologram-vignette" />
        {children}
      </body>
    </html>
  );
}
