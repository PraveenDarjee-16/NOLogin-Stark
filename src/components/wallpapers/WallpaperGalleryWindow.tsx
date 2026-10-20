'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Check,
  Upload,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Sliders,
  Cloud,
  Globe,
  Film,
  HardDrive,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { LiveWallpaperType, CloudFile } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  saveClientWallpaper,
  saveClientOfflineFile,
  getClientOfflineFiles,
  getClientWallpaperBlob,
} from '@/lib/client-storage';

interface Props {
  currentWallpaperType: LiveWallpaperType;
  customWallpaperUrl?: string;
  onSelectWallpaper: (type: LiveWallpaperType, customUrl?: string) => void;
  onOpenHologramControls: () => void;
}

interface TemplateOption {
  type: LiveWallpaperType;
  title: string;
  tagline: string;
  accent: string;
  badge: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    type: 'spiderman-city',
    title: 'Spider-Man City Swing',
    tagline: 'Cinematic Night Skyline',
    accent: '#ef4444',
    badge: 'CINEMATIC DYNAMIC',
    description:
      'Animated city skyline skyscrapers, rotating searchlight beams, web trajectory lines, and hero swinging silhouette.',
  },
  {
    type: 'spiderman-rescue',
    title: 'Spider-Man Rescue',
    tagline: 'TASM2 Emotional Twilight',
    accent: '#f59e0b',
    badge: 'EMOTIONAL ATMOSPHERE',
    description:
      'Atmospheric slow-motion rain streaks, warm golden sunset embers, and electric cyan shockwave pulses.',
  },
  {
    type: 'blue-hologram',
    title: 'Blue Hologram',
    tagline: 'Stark Cybernetic Grid',
    accent: '#00f0ff',
    badge: 'CYBER MATRIX',
    description:
      'Floating cyan matrix particles with glowing interconnecting constellation links, rotating wireframes, and scanning beams.',
  },
  {
    type: 'arc-reactor',
    title: 'Arc Reactor',
    tagline: 'Tony Stark Palladium Core',
    accent: '#38bdf8',
    badge: 'ENERGY CORE',
    description:
      'Authentic Stark Industries Arc Reactor with rotating segmented magnetic coils, triangular core, and blue plasma pulses.',
  },
  {
    type: 'edith-orbital',
    title: 'EDITH Orbital Grid',
    tagline: 'Global Defense Telemetry',
    accent: '#10b981',
    badge: 'EDITH HUD',
    description:
      'Planetary defense grid coordinates, rotating radar sector sweeps, tracking telemetry, and 4 orbital satellites.',
  },
  {
    type: 'quantum-core',
    title: 'Quantum Core',
    tagline: 'Stark Multiverse Vortex',
    accent: '#a855f7',
    badge: 'QUANTUM REALM',
    description:
      'Vibrant quantum realm particle singularity with dynamic multi-color filaments and high-energy subatomic vortex.',
  },
];

type GalleryTab = 'builtin' | 'cloud' | 'add';

export default function WallpaperGalleryWindow({
  currentWallpaperType,
  customWallpaperUrl,
  onSelectWallpaper,
  onOpenHologramControls,
}: Props) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('builtin');
  const [isUploading, setIsUploading] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudMediaFilter, setCloudMediaFilter] = useState<'all' | 'videos' | 'photos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [webUrlInput, setWebUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'video' | 'image'>('video');

  const [activeCustomInfo, setActiveCustomInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load user files from the website's cloud storage and browser IndexedDB
  const loadCloudMedia = async () => {
    setIsLoadingCloud(true);
    try {
      let serverFiles: CloudFile[] = [];
      try {
        const res = await fetch('/api/files');
        if (res.ok) {
          const data = await res.json();
          if (data.files) serverFiles = data.files;
        }
      } catch {}

      // Retrieve local offline files from browser IndexedDB
      let offlineFiles: CloudFile[] = [];
      try {
        offlineFiles = await getClientOfflineFiles();
      } catch {}

      const combined = [...serverFiles, ...offlineFiles];
      const seen = new Set<string>();
      const media = combined.filter((f) => {
        if (f.isTrash) return false;
        const isVid = f.category === 'videos' || f.mimeType?.startsWith('video/');
        const isImg = f.category === 'photos' || f.mimeType?.startsWith('image/');
        if (!isVid && !isImg) return false;
        const key = f.name + '_' + f.size;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setCloudFiles(media);
    } catch (err) {
      console.error('Failed to load cloud media:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    loadCloudMedia();
  }, []);

  const handleApply = (type: LiveWallpaperType, url?: string) => {
    onSelectWallpaper(type, url);
  };

  // Upload custom file from the current device (handles large videos > 4.5MB for Vercel)
  const handleUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const isVid =
      file.type.startsWith('video/') ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.webm');

    try {
      // 1. Immediately store in browser IndexedDB (wallpapers store + files store)
      const localResult = await saveClientWallpaper(file);
      await saveClientOfflineFile(file, null);

      const clientRefUrl = `indexeddb://${localResult.id}`;
      handleApply(isVid ? 'custom-video' : 'custom-image', clientRefUrl);
      setActiveCustomInfo({ name: file.name, size: file.size });

      // 2. Register metadata with server database (/api/files) using 100 bytes JSON
      try {
        await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storageKey: `local_${localResult.id}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
            folderId: null,
          }),
        });
      } catch (metaErr) {
        console.warn('Metadata registration notice:', metaErr);
      }

      // 3. If cloud direct upload is configured, also push to cloud
      if (file.size > 3.5 * 1024 * 1024) {
        try {
          const urlRes = await fetch('/api/storage/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
            }),
          });
          const urlData = await urlRes.json();
          if (urlData.success && urlData.uploadUrl) {
            await fetch(urlData.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
              },
              body: file,
            });
          }
        } catch (cloudErr) {
          console.warn('Cloud sync in progress or fallback to browser storage:', cloudErr);
        }
      }

      await loadCloudMedia();
    } catch (err) {
      console.error('Wallpaper processing failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Set wallpaper from online URL
  const handleApplyWebUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrlInput.trim()) return;
    const url = webUrlInput.trim();
    const isVid = urlType === 'video' || url.endsWith('.mp4') || url.endsWith('.webm');
    handleApply(isVid ? 'custom-video' : 'custom-image', url);
  };

  // Filtered cloud files
  const filteredCloudFiles = cloudFiles.filter((f) => {
    if (cloudMediaFilter === 'videos' && f.category !== 'videos' && !f.mimeType?.startsWith('video/')) {
      return false;
    }
    if (cloudMediaFilter === 'photos' && f.category !== 'photos' && !f.mimeType?.startsWith('image/')) {
      return false;
    }
    if (searchQuery.trim() && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'rgba(3, 9, 24, 0.96)',
        padding: '20px',
        boxSizing: 'border-box',
        gap: '16px',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,.mp4,.webm,.mov,.mkv,.avi,.png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        onChange={handleUploadFromDevice}
      />

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-hud)',
          paddingBottom: '14px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '1rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={18} />
            <span>LIVE WALLPAPER ARCHIVE</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Choose from built-in shaders, your website cloud storage, or add a custom wallpaper.
          </div>
        </div>

        {/* Action Button that switches to Add Tab instead of jumping to laptop desktop */}
        <button
          className={`holo-btn ${activeTab === 'add' ? 'primary' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <Plus size={14} />
          <span>Add Live Wallpaper</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          paddingBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`holo-tab-btn ${activeTab === 'builtin' ? 'active' : ''}`}
          onClick={() => setActiveTab('builtin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '4px',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            border: activeTab === 'builtin' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'builtin' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(4, 14, 34, 0.6)',
            color: activeTab === 'builtin' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={14} />
          <span>BUILT-IN GALLERY ({TEMPLATES.length})</span>
        </button>

        <button
          className={`holo-tab-btn ${activeTab === 'cloud' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('cloud');
            loadCloudMedia();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '4px',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            border: activeTab === 'cloud' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'cloud' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(4, 14, 34, 0.6)',
            color: activeTab === 'cloud' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Cloud size={14} />
          <span>FROM MY WEBSITE CLOUD ({cloudFiles.length})</span>
        </button>

        <button
          className={`holo-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '4px',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            border: activeTab === 'add' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'add' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(4, 14, 34, 0.6)',
            color: activeTab === 'add' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={14} />
          <span>ADD / UPLOAD WALLPAPER</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BUILT-IN SHADERS & PRESETS GALLERY                     */}
      {/* ============================================================== */}
      {activeTab === 'builtin' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {TEMPLATES.map((tmpl) => {
            const isCurrent = currentWallpaperType === tmpl.type;
            return (
              <div
                key={tmpl.type}
                className="hologram-panel"
                style={{
                  padding: '16px',
                  background: isCurrent ? 'rgba(0, 240, 255, 0.14)' : 'rgba(4, 14, 34, 0.65)',
                  borderColor: isCurrent ? 'var(--accent-cyan)' : 'var(--border-hud)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => handleApply(tmpl.type)}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-hud)',
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: tmpl.accent,
                        border: `1px solid ${tmpl.accent}55`,
                      }}
                    >
                      {tmpl.badge}
                    </span>

                    {isCurrent && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-hud)',
                        }}
                      >
                        <Check size={14} />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '4px',
                      fontFamily: 'var(--font-hud)',
                    }}
                  >
                    {tmpl.title}
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-blue)',
                      marginBottom: '10px',
                    }}
                  >
                    {tmpl.tagline}
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.45',
                      marginBottom: '16px',
                    }}
                  >
                    {tmpl.description}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    className={`holo-btn ${isCurrent ? 'primary' : ''}`}
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(tmpl.type);
                    }}
                  >
                    {isCurrent ? <Check size={14} /> : <Sparkles size={14} />}
                    <span>{isCurrent ? 'Active Wallpaper' : 'Apply Wallpaper'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FROM MY WEBSITE CLOUD STORAGE                           */}
      {/* ============================================================== */}
      {activeTab === 'cloud' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Subheader controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px',
              background: 'rgba(6, 16, 38, 0.7)',
              border: '1px solid var(--border-hud)',
              borderRadius: '6px',
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'videos', 'photos'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`holo-btn ${cloudMediaFilter === cat ? 'primary' : ''}`}
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  onClick={() => setCloudMediaFilter(cat)}
                >
                  {cat === 'all' ? 'All Media' : cat === 'videos' ? 'Videos Only' : 'Photos Only'}
                </button>
              ))}
            </div>

            {/* Search Box & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(2, 6, 18, 0.8)',
                  border: '1px solid var(--border-hud)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  gap: '6px',
                }}
              >
                <Search size={13} style={{ color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search cloud media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.78rem',
                    outline: 'none',
                    width: '140px',
                  }}
                />
              </div>

              <button
                className="holo-btn"
                style={{ padding: '4px 8px' }}
                onClick={loadCloudMedia}
                title="Refresh Cloud Media"
              >
                <RefreshCw size={13} className={isLoadingCloud ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Cloud Files Grid */}
          {isLoadingCloud ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-hud)',
                fontSize: '0.88rem',
              }}
            >
              RETRIEVING FILES FROM STARK CLOUD ARCHIVE...
            </div>
          ) : filteredCloudFiles.length === 0 ? (
            <div
              className="hologram-panel"
              style={{
                padding: '36px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Cloud size={38} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.92rem', color: '#fff' }}>
                NO CLOUD MEDIA FOUND
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '380px' }}>
                You have not uploaded any videos or photos to your STARK // EDITH cloud account yet.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  className="holo-btn primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  <span>Upload File to Cloud</span>
                </button>
                <button
                  className="holo-btn"
                  onClick={() => setActiveTab('builtin')}
                >
                  <Sparkles size={14} />
                  <span>Use Built-in Gallery</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {filteredCloudFiles.map((file) => {
                const fileUrl = `/api/files/download/${file.id}?preview=true`;
                const isVid = file.category === 'videos' || file.mimeType?.startsWith('video/');
                const isCurrent =
                  customWallpaperUrl === fileUrl ||
                  (customWallpaperUrl && customWallpaperUrl.includes(file.id));

                return (
                  <div
                    key={file.id}
                    className="hologram-panel"
                    style={{
                      padding: '12px',
                      background: isCurrent ? 'rgba(0, 240, 255, 0.14)' : 'rgba(4, 14, 34, 0.7)',
                      borderColor: isCurrent ? 'var(--accent-cyan)' : 'var(--border-hud)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '6px',
                      gap: '10px',
                    }}
                  >
                    {/* Media Preview Box */}
                    <div
                      style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: '#020612',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {isVid ? (
                        <video
                          src={file.id.startsWith('local_file_') ? undefined : fileUrl}
                          ref={(el) => {
                            if (el && file.id.startsWith('local_file_') && !el.src) {
                              getClientWallpaperBlob(file.id).then((blob) => {
                                if (blob && el) {
                                  el.src = URL.createObjectURL(blob);
                                }
                              });
                            }
                          }}
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onMouseEnter={(e) => {
                            try {
                              e.currentTarget.play();
                            } catch {}
                          }}
                          onMouseLeave={(e) => {
                            try {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            } catch {}
                          }}
                        />
                      ) : (
                        <img
                          src={file.id.startsWith('local_file_') ? undefined : fileUrl}
                          ref={(el) => {
                            if (el && file.id.startsWith('local_file_') && !el.src) {
                              getClientWallpaperBlob(file.id).then((blob) => {
                                if (blob && el) {
                                  el.src = URL.createObjectURL(blob);
                                }
                              });
                            }
                          }}
                          alt={file.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}

                      <span
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(2, 6, 23, 0.85)',
                          color: isVid ? '#38bdf8' : '#f59e0b',
                          border: `1px solid ${isVid ? '#38bdf8' : '#f59e0b'}88`,
                          borderRadius: '3px',
                          padding: '1px 6px',
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-hud)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isVid ? <Film size={10} /> : <ImageIcon size={10} />}
                        {file.id.startsWith('local_file_') ? 'DEVICE // ' : ''}{isVid ? 'VIDEO' : 'IMAGE'}
                      </span>

                      {isCurrent && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0, 240, 255, 0.9)',
                            color: '#020617',
                            fontWeight: 'bold',
                            borderRadius: '3px',
                            padding: '1px 6px',
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-hud)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Check size={11} />
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: '#fff',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={file.name}
                      >
                        {file.name}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.7rem',
                          color: 'var(--text-dim)',
                          marginTop: '4px',
                        }}
                      >
                        <span>{formatBytes(file.size)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      className={`holo-btn ${isCurrent ? 'primary' : ''}`}
                      style={{ width: '100%', fontSize: '0.78rem' }}
                      onClick={() => {
                        const targetUrl =
                          file.id.startsWith('local_file_') || file.storageKey?.startsWith('local_')
                            ? `indexeddb://${file.id}`
                            : fileUrl;
                        handleApply(isVid ? 'custom-video' : 'custom-image', targetUrl);
                      }}
                    >
                      {isCurrent ? <Check size={13} /> : <Sparkles size={13} />}
                      <span>{isCurrent ? 'Active Wallpaper' : 'Set as Live Wallpaper'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ADD / UPLOAD NEW WALLPAPER                              */}
      {/* ============================================================== */}
      {activeTab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isUploading && (
            <div
              className="hologram-panel"
              style={{
                padding: '14px 18px',
                background: 'rgba(0, 240, 255, 0.15)',
                borderColor: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                borderRadius: '6px',
              }}
            >
              <RefreshCw
                size={20}
                className="animate-spin"
                style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}
              />
              <div>
                <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>
                  PROCESSING HIGH-DEF VIDEO MATRIX // CACHING TO BROWSER
                </div>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.74rem', marginTop: '2px' }}>
                  Storing video in browser IndexedDB memory for instant, zero-buffer playback...
                </div>
              </div>
            </div>
          )}

          {activeCustomInfo && !isUploading && (
            <div
              className="hologram-panel"
              style={{
                padding: '14px 18px',
                background: 'rgba(0, 240, 255, 0.12)',
                borderColor: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0, 240, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                    flexShrink: 0,
                  }}
                >
                  <Check size={18} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                    Active Live Wallpaper: {activeCustomInfo.name} ({formatBytes(activeCustomInfo.size)})
                  </div>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.74rem', marginTop: '2px' }}>
                    Saved to browser storage & playing live on your desktop background!
                  </div>
                </div>
              </div>

              <button
                className="holo-btn primary"
                onClick={() => setActiveTab('cloud')}
                style={{ fontSize: '0.74rem', flexShrink: 0 }}
              >
                <span>View Media</span>
              </button>
            </div>
          )}
          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
            }}
          >
            Add a new video (MP4/WebM) or high-res image (PNG/JPEG/GIF) to use as your live background across all devices.
          </div>

          {/* Option 1: Select from existing Website Cloud Files */}
          <div
            className="hologram-panel"
            style={{
              padding: '18px',
              background: 'rgba(6, 18, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
              border: '1px solid rgba(0, 240, 255, 0.4)',
            }}
            onClick={() => setActiveTab('cloud')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '6px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Cloud size={22} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.92rem', color: '#fff' }}>
                  CHOOSE FROM WEBSITE CLOUD STORAGE
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Select from {cloudFiles.length} media files already stored in your cloud account (no local file needed on this device).
                </div>
              </div>
            </div>

            <button className="holo-btn primary" onClick={() => setActiveTab('cloud')}>
              <span>Browse Cloud Files</span>
            </button>
          </div>

          {/* Option 2: Upload from Current Device */}
          <div
            className="hologram-panel"
            style={{
              padding: '18px',
              background: 'rgba(6, 18, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid #38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <HardDrive size={22} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.92rem', color: '#fff' }}>
                  UPLOAD FROM THIS DEVICE
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Select an MP4/WebM video or image from your current laptop, phone, or tablet.
                </div>
              </div>
            </div>

            <button
              className="holo-btn"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
            >
              <Upload size={14} />
              <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
            </button>
          </div>

          {/* Option 3: Direct Web Video / Image URL */}
          <div
            className="hologram-panel"
            style={{
              padding: '18px',
              background: 'rgba(6, 18, 42, 0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Globe size={22} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.92rem', color: '#fff' }}>
                  SET VIA ONLINE WEB VIDEO OR IMAGE URL
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Paste any direct online video (.mp4/.webm) or high-res image link without downloading.
                </div>
              </div>
            </div>

            <form onSubmit={handleApplyWebUrl} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={urlType}
                onChange={(e) => setUrlType(e.target.value as any)}
                style={{
                  background: 'rgba(2, 6, 18, 0.9)',
                  border: '1px solid var(--border-hud)',
                  color: 'var(--accent-cyan)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-hud)',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                <option value="video">VIDEO (MP4/WebM)</option>
                <option value="image">IMAGE (PNG/JPG/GIF)</option>
              </select>

              <input
                type="url"
                placeholder="https://example.com/wallpaper.mp4"
                value={webUrlInput}
                onChange={(e) => setWebUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: 'rgba(2, 6, 18, 0.9)',
                  border: '1px solid var(--border-hud)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />

              <button type="submit" className="holo-btn primary" disabled={!webUrlInput.trim()}>
                <ExternalLink size={14} />
                <span>Apply Web URL</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Wallpaper Section (if one is active) */}
      {(currentWallpaperType === 'custom-video' || currentWallpaperType === 'custom-image') && (
        <div
          className="hologram-panel"
          style={{
            padding: '14px 18px',
            background: 'rgba(6, 20, 48, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-hud)',
                fontSize: '0.84rem',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} />
              <span>CUSTOM WALLPAPER CURRENTLY APPLIED</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Synced to your account and accessible across all devices.
            </div>
          </div>
          <button
            className="holo-btn danger"
            onClick={() => handleApply('spiderman-city')}
          >
            <RotateCcw size={14} />
            <span>Reset to Built-in Gallery</span>
          </button>
        </div>
      )}

      {/* Shortcut to Hologram Controls */}
      <div
        style={{
          marginTop: 'auto',
          padding: '14px',
          background: 'rgba(0, 240, 255, 0.08)',
          border: '1px solid var(--border-hud)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
          Fine-tune the holographic overlay scanlines and particle intensity for this wallpaper:
        </div>
        <button className="holo-btn primary" onClick={onOpenHologramControls}>
          <Sliders size={14} />
          <span>Hologram Calibration</span>
        </button>
      </div>
    </div>
  );
}
