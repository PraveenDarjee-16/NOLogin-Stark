'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Search,
  ArrowUpDown,
  Grid,
  List,
  Star,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  MoreVertical,
  ChevronRight,
  Eye,
  Edit2,
  MoveRight,
  ArrowLeft,
  RotateCcw,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { CloudFile, CloudFolder, FileCategory } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  saveClientOfflineFile,
  getClientOfflineFiles,
  deleteClientOfflineFile,
  getClientOfflineFileBlob,
} from '@/lib/client-storage';
import FileDetailsModal from './FileDetailsModal';
import MoveFileModal from './MoveFileModal';

interface Props {
  initialFolderId?: string | null;
  initialCategory?: FileCategory | null;
  initialSystemView?: 'recent' | 'favorites' | 'trash' | null;
  onPreviewFile: (file: CloudFile) => void;
  onRefreshStorageStats: () => void;
}

type SortField = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

export default function FileExplorerWindow({
  initialFolderId = null,
  initialCategory = null,
  initialSystemView = null,
  onPreviewFile,
  onRefreshStorageStats,
}: Props) {
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [currentCategory, setCurrentCategory] = useState<FileCategory | null>(initialCategory);
  const [isFavoritesView, setIsFavoritesView] = useState(initialSystemView === 'favorites');
  const [isTrashView, setIsTrashView] = useState(initialSystemView === 'trash');
  const [isRecentView, setIsRecentView] = useState(initialSystemView === 'recent');

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  // Modals state
  const [detailsFile, setDetailsFile] = useState<CloudFile | null>(null);
  const [moveFile, setMoveFile] = useState<CloudFile | null>(null);
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [newFolderPrompt, setNewFolderPrompt] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch folders and files
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load folders
      const foldersRes = await fetch(`/api/folders${isTrashView ? '?trash=true' : ''}`);
      const foldersData = await foldersRes.json();
      if (foldersData.folders) {
        setFolders(foldersData.folders);
      }

      // Load files
      let filesUrl = '/api/files?';
      if (isTrashView) {
        filesUrl += 'trash=true';
      } else if (isFavoritesView) {
        filesUrl += 'favorites=true';
      } else if (isRecentView) {
        filesUrl += 'recent=true';
      } else if (currentCategory) {
        filesUrl += `category=${currentCategory}`;
      } else if (currentFolderId) {
        filesUrl += `folderId=${currentFolderId}`;
      } else {
        filesUrl += 'folderId=root';
      }

      let serverFiles: CloudFile[] = [];
      const filesRes = await fetch(filesUrl);
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (filesData.files) {
          serverFiles = filesData.files;
        }
      }

      // Also retrieve client offline files from browser IndexedDB
      const offlineFiles = await getClientOfflineFiles();
      const filteredOffline = offlineFiles.filter((f) => {
        if (isTrashView) return f.isTrash;
        if (f.isTrash) return false;
        if (isFavoritesView) return f.isFavorite;
        if (isRecentView) return true;
        if (currentCategory) return f.category === currentCategory;
        if (currentFolderId && currentFolderId !== 'root') return f.folderId === currentFolderId;
        return !f.folderId;
      });

      // Avoid duplicates across server and offline storage
      const combined = [...serverFiles, ...filteredOffline];
      const seen = new Set<string>();
      const deduplicated: CloudFile[] = [];
      for (const f of combined) {
        const key = f.name.toLowerCase().trim() + '_' + f.size;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(f);
        }
      }

      setFiles(deduplicated);
    } catch (err) {
      console.error('Error fetching explorer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolderId, currentCategory, isFavoritesView, isTrashView, isRecentView]);

  // Navigate to folder
  const navigateToFolder = (folderId: string | null) => {
    setIsFavoritesView(false);
    setIsTrashView(false);
    setIsRecentView(false);
    setCurrentCategory(null);
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
  };

  // Switch to system views
  const setSystemView = (type: string) => {
    setSelectedFileIds(new Set());
    if (type === 'favorites') {
      setIsFavoritesView(true);
      setIsTrashView(false);
      setIsRecentView(false);
      setCurrentCategory(null);
      setCurrentFolderId(null);
    } else if (type === 'trash') {
      setIsFavoritesView(false);
      setIsTrashView(true);
      setIsRecentView(false);
      setCurrentCategory(null);
      setCurrentFolderId(null);
    } else if (type === 'recent') {
      setIsFavoritesView(false);
      setIsTrashView(false);
      setIsRecentView(true);
      setCurrentCategory(null);
      setCurrentFolderId(null);
    } else if (
      ['documents', 'photos', 'videos', 'music', 'downloads', 'other'].includes(type)
    ) {
      setIsFavoritesView(false);
      setIsTrashView(false);
      setIsRecentView(false);
      setCurrentCategory(type as FileCategory);
      setCurrentFolderId(null);
    }
  };

  // Upload handler
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;

    setUploadProgress(10);
    setUploadStatusText(`Preparing ${fileList.length} file(s)...`);

    const filesArray = Array.from(fileList);
    let completed = 0;

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadStatusText(`Uploading ${file.name} (${i + 1}/${filesArray.length})...`);

      let uploadSuccess = false;

      // Always save a permanent local copy to IndexedDB so files never get wiped on Vercel
      try {
        await saveClientOfflineFile(
          file,
          currentFolderId === 'root' ? null : currentFolderId
        );
        uploadSuccess = true;
      } catch (idxErr) {
        console.warn('Local offline backup notice:', idxErr);
      }

      // 1. If file > 3.5MB, try direct signed cloud upload to bypass Vercel 4.5MB payload limit
      if (file.size > 3.5 * 1024 * 1024) {
        try {
          const urlRes = await fetch('/api/storage/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'application/octet-stream',
            }),
          });
          const urlData = await urlRes.json();
          if (urlData.success && urlData.uploadUrl) {
            const uploadRes = await fetch(urlData.uploadUrl, {
              method: urlData.uploadMethod || 'PUT',
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              body: file,
            });
            if (uploadRes.ok) {
              await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  storageKey: urlData.storageKey,
                  name: file.name,
                  size: file.size,
                  mimeType: file.type || 'application/octet-stream',
                  folderId: currentFolderId === 'root' ? null : currentFolderId,
                }),
              });
              uploadSuccess = true;
            }
          }
        } catch (cloudErr) {
          console.warn('Direct cloud upload failed:', cloudErr);
        }
      }

      // 2. Standard server upload for files <= 3.5MB
      if (!uploadSuccess && file.size <= 3.5 * 1024 * 1024) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId && currentFolderId !== 'root') {
          formData.append('folderId', currentFolderId);
        }

        try {
          const res = await fetch('/api/files', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            uploadSuccess = true;
          }
        } catch (err) {
          console.warn('Standard server upload error:', file.name, err);
        }
      }

      // 3. Fallback: Save to browser IndexedDB if server is in ephemeral Vercel mode or failed
      if (!uploadSuccess) {
        try {
          const offlineFile = await saveClientOfflineFile(
            file,
            currentFolderId === 'root' ? null : currentFolderId
          );
          // Register 100-byte metadata with /api/files so server knows file exists
          try {
            await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                storageKey: offlineFile.storageKey,
                name: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
                folderId: currentFolderId === 'root' ? null : currentFolderId,
              }),
            });
          } catch {}
          uploadSuccess = true;
        } catch (idxErr) {
          console.error('Failed to store file in client storage:', idxErr);
        }
      }

      if (uploadSuccess) {
        completed++;
        setUploadProgress(Math.floor((completed / filesArray.length) * 100));
      }
    }

    setUploadStatusText('Upload complete!');
    setTimeout(() => {
      setUploadProgress(null);
      setUploadStatusText('');
      loadData();
      onRefreshStorageStats();
    }, 800);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });
      if (res.ok) {
        setNewFolderName('');
        setNewFolderPrompt(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Rename item
  const handleConfirmRename = async (id: string, isFolder: boolean) => {
    if (!renamingName.trim()) {
      setRenamingItemId(null);
      return;
    }
    try {
      const url = isFolder ? `/api/folders/${id}` : `/api/files/${id}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renamingName.trim() }),
      });
      setRenamingItemId(null);
      setRenamingName('');
      loadData();
    } catch (e) {
      console.error('Rename failed:', e);
    }
  };

  // Trash / Restore item
  const handleTrashFile = async (file: CloudFile, trash: boolean) => {
    try {
      await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: trash }),
      });
      loadData();
      onRefreshStorageStats();
    } catch (e) {
      console.error('Trash action failed:', e);
    }
  };

  const handleDeletePermanently = async (fileId: string) => {
    if (!confirm('Warning: This action will permanently delete this file from storage. Proceed?')) return;
    try {
      if (fileId.startsWith('local_file_')) {
        await deleteClientOfflineFile(fileId);
      }
      try {
        await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      } catch {}
      loadData();
      onRefreshStorageStats();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleEmptyTrash = async () => {
    if (files.length === 0) return;
    if (!confirm('Warning: Permanently delete all items currently in the Trash?')) return;
    try {
      for (const f of files) {
        await fetch(`/api/files/${f.id}`, { method: 'DELETE' });
      }
      loadData();
      onRefreshStorageStats();
    } catch (e) {
      console.error('Empty trash failed:', e);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (file: CloudFile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !file.isFavorite }),
      });
      loadData();
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  // Move file
  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    try {
      await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId }),
      });
      loadData();
    } catch (err) {
      console.error('Move file failed:', err);
    }
  };

  // Download folder as ZIP
  const handleDownloadZip = () => {
    if (!currentFolderId) {
      alert('Select a specific folder to download as a ZIP archive.');
      return;
    }
    window.open(`/api/folders/zip/${currentFolderId}`, '_blank');
  };

  // Direct file download
  const handleDownloadFile = async (file: CloudFile) => {
    if (file.id.startsWith('local_file_') || file.storageKey?.startsWith('local_')) {
      const blob = await getClientOfflineFileBlob(file.id, file.name);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
    }
    const link = document.createElement('a');
    link.href = `/api/files/download/${file.id}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort
  const filteredFiles = files.filter((f) => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortField === 'date') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'size') {
      cmp = a.size - b.size;
    } else if (sortField === 'type') {
      cmp = a.category.localeCompare(b.category);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Folder children in current folder view
  const currentChildFolders = folders.filter((f) => {
    if (isTrashView) return f.isTrash;
    if (f.isTrash) return false;
    if (f.isSystem) return false;
    return f.parentId === currentFolderId;
  });

  // Current folder display name
  const currentFolderObj = folders.find((f) => f.id === currentFolderId);
  const currentTitle = isTrashView
    ? 'Trash Bin'
    : isFavoritesView
    ? 'Favourites'
    : isRecentView
    ? 'Recently Uploaded'
    : currentCategory
    ? `${currentCategory.toUpperCase()} ARCHIVE`
    : currentFolderObj
    ? currentFolderObj.name
    : 'Root Cloud Storage';

  const getFileIcon = (category: FileCategory, size = 28) => {
    switch (category) {
      case 'photos':
        return <ImageIcon size={size} />;
      case 'videos':
        return <Film size={size} />;
      case 'music':
        return <Music size={size} />;
      case 'documents':
        return <FileText size={size} />;
      case 'downloads':
        return <Download size={size} />;
      default:
        return <Archive size={size} />;
    }
  };

  return (
    <div
      className="explorer-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleUploadFiles(e.target.files);
        }}
      />

      {/* Upload Drag Overlay */}
      {isDraggingOver && (
        <div className="dropzone-overlay">
          <Upload size={48} />
          <div>DROP FILES TO INSTANTLY UPLOAD TO CLOUD</div>
        </div>
      )}

      {/* Upload Progress Bar Banner */}
      {uploadProgress !== null && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 240, 255, 0.15)',
            borderBottom: '1px solid var(--border-hud)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={14} className="spin-slow" />
            <span>{uploadStatusText}</span>
          </div>
          <div>{uploadProgress}%</div>
        </div>
      )}

      {/* Explorer Toolbar */}
      <div className="explorer-toolbar">
        <div className="explorer-nav-group">
          {currentFolderId && (
            <button
              className="window-control-btn"
              onClick={() => {
                const parent = currentFolderObj?.parentId || null;
                navigateToFolder(parent);
              }}
              title="Navigate Up"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          <div className="explorer-breadcrumbs">
            <span
              className={`breadcrumb-item ${!currentFolderId ? 'active' : ''}`}
              onClick={() => navigateToFolder(null)}
            >
              Cloud Drive
            </span>
            {currentFolderObj && (
              <>
                <ChevronRight size={12} />
                <span className="breadcrumb-item active">{currentFolderObj.name}</span>
              </>
            )}
            {(isTrashView || isFavoritesView || isRecentView || currentCategory) && (
              <>
                <ChevronRight size={12} />
                <span className="breadcrumb-item active">{currentTitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '180px' }}>
          <input
            type="text"
            className="holo-input"
            style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '6px 10px 6px 30px' }}
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
        </div>

        {/* Action Controls */}
        <div className="explorer-actions">
          {isTrashView ? (
            <button
              className="holo-btn danger"
              onClick={handleEmptyTrash}
              title="Permanently remove all items in Trash"
            >
              <Trash2 size={14} />
              <span>Empty Trash</span>
            </button>
          ) : (
            <>
              <button
                className="holo-btn"
                onClick={() => setNewFolderPrompt(true)}
                title="Create New Folder"
              >
                <FolderPlus size={14} />
                <span>New Folder</span>
              </button>

              <button
                className="holo-btn primary"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Files"
              >
                <Upload size={14} />
                <span>Upload</span>
              </button>
            </>
          )}

          {currentFolderId && (
            <button
              className="holo-btn"
              onClick={handleDownloadZip}
              title="Download entire directory as ZIP archive"
            >
              <Download size={14} />
              <span>ZIP</span>
            </button>
          )}

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              style={{
                background: 'rgba(3, 10, 26, 0.7)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-hud)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-hud)',
                outline: 'none',
              }}
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>

            <button
              className="window-control-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown size={13} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <button
            className="window-control-btn"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} view`}
          >
            {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
          </button>

          <button
            className="window-control-btn"
            onClick={loadData}
            title="Refresh files"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* New Folder Prompt Inline */}
      {newFolderPrompt && (
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(6, 20, 48, 0.95)',
            borderBottom: '1px solid var(--border-hud-bright)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <FolderPlus size={16} style={{ color: 'var(--accent-cyan)' }} />
          <input
            type="text"
            autoFocus
            className="holo-input"
            style={{ maxWidth: '280px', padding: '6px 10px', fontSize: '0.85rem' }}
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setNewFolderPrompt(false);
            }}
          />
          <button className="holo-btn primary" onClick={handleCreateFolder}>
            Create
          </button>
          <button className="holo-btn" onClick={() => setNewFolderPrompt(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* Split View: Sidebar + Main Area */}
      <div className="explorer-split-view">
        {/* Sidebar */}
        <aside className="explorer-sidebar">
          <div className="sidebar-section-title">SYSTEM ARCHIVES</div>

          <div
            className={`sidebar-folder-item ${
              !currentFolderId && !currentCategory && !isFavoritesView && !isTrashView && !isRecentView
                ? 'active'
                : ''
            }`}
            onClick={() => navigateToFolder(null)}
          >
            <Folder size={15} />
            <span>Root Storage</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'documents' ? 'active' : ''}`}
            onClick={() => setSystemView('documents')}
          >
            <FileText size={15} />
            <span>Documents</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'photos' ? 'active' : ''}`}
            onClick={() => setSystemView('photos')}
          >
            <ImageIcon size={15} />
            <span>Photos</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'videos' ? 'active' : ''}`}
            onClick={() => setSystemView('videos')}
          >
            <Film size={15} />
            <span>Videos</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'music' ? 'active' : ''}`}
            onClick={() => setSystemView('music')}
          >
            <Music size={15} />
            <span>Music</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'downloads' ? 'active' : ''}`}
            onClick={() => setSystemView('downloads')}
          >
            <Download size={15} />
            <span>Downloads</span>
          </div>

          <div
            className={`sidebar-folder-item ${currentCategory === 'other' ? 'active' : ''}`}
            onClick={() => setSystemView('other')}
          >
            <Archive size={15} />
            <span>Other Files</span>
          </div>

          <div className="sidebar-section-title" style={{ marginTop: '12px' }}>
            QUICK ACCESS
          </div>

          <div
            className={`sidebar-folder-item ${isRecentView ? 'active' : ''}`}
            onClick={() => setSystemView('recent')}
          >
            <RefreshCw size={15} />
            <span>Recently Uploaded</span>
          </div>

          <div
            className={`sidebar-folder-item ${isFavoritesView ? 'active' : ''}`}
            onClick={() => setSystemView('favorites')}
          >
            <Star size={15} style={{ color: '#f59e0b' }} />
            <span>Favourites</span>
          </div>

          <div
            className={`sidebar-folder-item ${isTrashView ? 'active' : ''}`}
            onClick={() => setSystemView('trash')}
          >
            <Trash2 size={15} style={{ color: 'var(--accent-red)' }} />
            <span>Trash Bin</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="explorer-file-area">
          {isLoading ? (
            <div className="explorer-empty-state">
              <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--accent-cyan)' }} />
              <div>ACCESSING SECURE CLUSTER...</div>
            </div>
          ) : currentChildFolders.length === 0 && sortedFiles.length === 0 ? (
            <div className="explorer-empty-state">
              <Folder size={44} style={{ opacity: 0.35, color: 'var(--accent-cyan)' }} />
              <div>THIS CLASSIFIED DIRECTORY IS CURRENTLY EMPTY</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '300px' }}>
                Drag and drop files here or click Upload above to store files securely.
              </div>
            </div>
          ) : (
            <>
              {/* Folder Cards (if in folder view) */}
              {currentChildFolders.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-hud)',
                      fontSize: '0.72rem',
                      color: 'var(--text-dim)',
                      letterSpacing: '0.08em',
                      marginBottom: '10px',
                    }}
                  >
                    DIRECTORIES ({currentChildFolders.length})
                  </div>

                  <div className="file-grid">
                    {currentChildFolders.map((f) => (
                      <div
                        key={f.id}
                        className="file-item-card"
                        onDoubleClick={() => navigateToFolder(f.id)}
                        onClick={() => navigateToFolder(f.id)}
                      >
                        <div className="file-icon-box" style={{ color: 'var(--accent-cyan)' }}>
                          <Folder size={34} />
                        </div>
                        <div className="file-name-text">{f.name}</div>
                        <div className="file-meta-text">Directory</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Grid / List */}
              {sortedFiles.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-hud)',
                      fontSize: '0.72rem',
                      color: 'var(--text-dim)',
                      letterSpacing: '0.08em',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>FILES ({sortedFiles.length})</span>
                    <span>SORT: {sortField.toUpperCase()} ({sortOrder.toUpperCase()})</span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="file-grid">
                      {sortedFiles.map((file) => {
                        const isSelected = selectedFileIds.has(file.id);
                        return (
                          <div
                            key={file.id}
                            className={`file-item-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (selectedFileIds.has(file.id)) {
                                onPreviewFile(file);
                              } else {
                                setSelectedFileIds(new Set([file.id]));
                              }
                            }}
                            onDoubleClick={() => onPreviewFile(file)}
                          >
                            {/* Favorite star */}
                            {!isTrashView && (
                              <button
                                onClick={(e) => handleToggleFavorite(file, e)}
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: file.isFavorite ? '#f59e0b' : 'var(--text-dim)',
                                }}
                                title={file.isFavorite ? 'Unfavorite' : 'Favorite'}
                              >
                                <Star size={13} fill={file.isFavorite ? '#f59e0b' : 'none'} />
                              </button>
                            )}

                            {file.category === 'photos' ? (
                              <div
                                style={{
                                  width: '100%',
                                  height: '76px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  marginBottom: '8px',
                                  background: 'rgba(0,0,0,0.4)',
                                  position: 'relative',
                                  border: '1px solid rgba(0, 240, 255, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={file.id.startsWith('local_file_') ? undefined : `/api/files/download/${file.id}?preview=true`}
                                  ref={(el) => {
                                    if (el && file.id.startsWith('local_file_') && !el.src) {
                                      getClientOfflineFileBlob(file.id, file.name).then((b) => {
                                        if (b && el) el.src = URL.createObjectURL(b);
                                      });
                                    }
                                  }}
                                  alt={file.name}
                                  loading="lazy"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <ImageIcon size={28} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />
                              </div>
                            ) : file.category === 'videos' ? (
                              <div
                                className="file-icon-box"
                                style={{ position: 'relative', color: '#ef4444' }}
                              >
                                <Film size={34} />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      background: 'rgba(239, 68, 68, 0.8)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Play size={9} fill="#ffffff" color="#ffffff" style={{ marginLeft: '1px' }} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="file-icon-box">
                                {getFileIcon(file.category)}
                              </div>
                            )}

                            {renamingItemId === file.id ? (
                              <input
                                autoFocus
                                className="holo-input"
                                style={{ fontSize: '0.75rem', padding: '2px 4px', textAlign: 'center' }}
                                value={renamingName}
                                onChange={(e) => setRenamingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleConfirmRename(file.id, false);
                                  if (e.key === 'Escape') setRenamingItemId(null);
                                }}
                                onBlur={() => handleConfirmRename(file.id, false)}
                              />
                            ) : (
                              <div className="file-name-text" title={file.name}>
                                {file.name}
                              </div>
                            )}

                            <div className="file-meta-text">{formatBytes(file.size)}</div>

                            {/* Card action buttons */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '8px',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="window-control-btn"
                                onClick={() => onPreviewFile(file)}
                                title="Preview File"
                              >
                                <Eye size={12} />
                              </button>

                              <button
                                className="window-control-btn"
                                onClick={() => handleDownloadFile(file)}
                                title="Download File"
                              >
                                <Download size={12} />
                              </button>

                              <button
                                className="window-control-btn"
                                onClick={() => setDetailsFile(file)}
                                title="File Details / Telemetry"
                              >
                                <MoreVertical size={12} />
                              </button>

                              {!isTrashView ? (
                                <button
                                  className="window-control-btn close"
                                  onClick={() => handleTrashFile(file, true)}
                                  title="Move to Trash"
                                >
                                  <Trash2 size={12} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="window-control-btn"
                                    onClick={() => handleTrashFile(file, false)}
                                    title="Restore from Trash"
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                  <button
                                    className="window-control-btn close"
                                    onClick={() => handleDeletePermanently(file.id)}
                                    title="Delete Permanently"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Table List View */
                    <div
                      style={{
                        background: 'rgba(3, 9, 24, 0.65)',
                        border: '1px solid var(--border-hud)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: 'rgba(0, 240, 255, 0.1)',
                              borderBottom: '1px solid var(--border-hud)',
                              fontFamily: 'var(--font-hud)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.72rem',
                            }}
                          >
                            <th style={{ padding: '8px 12px' }}>NAME</th>
                            <th style={{ padding: '8px 12px' }}>CATEGORY</th>
                            <th style={{ padding: '8px 12px' }}>SIZE</th>
                            <th style={{ padding: '8px 12px' }}>DATE</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFiles.map((file) => (
                            <tr
                              key={file.id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedFileIds(new Set([file.id]))}
                              onDoubleClick={() => onPreviewFile(file)}
                            >
                              <td
                                style={{
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                {getFileIcon(file.category, 16)}
                                <span>{file.name}</span>
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                {file.category}
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--text-dim)',
                                }}
                              >
                                {formatBytes(file.size)}
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--text-dim)',
                                }}
                              >
                                {formatDate(file.createdAt)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    gap: '6px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="window-control-btn"
                                    onClick={() => onPreviewFile(file)}
                                    title="Preview"
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button
                                    className="window-control-btn"
                                    onClick={() => handleDownloadFile(file)}
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </button>
                                  <button
                                    className="window-control-btn"
                                    onClick={() => setDetailsFile(file)}
                                    title="Details"
                                  >
                                    <MoreVertical size={12} />
                                  </button>
                                  {!isTrashView ? (
                                    <button
                                      className="window-control-btn close"
                                      onClick={() => handleTrashFile(file, true)}
                                      title="Trash"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  ) : (
                                    <button
                                      className="window-control-btn"
                                      onClick={() => handleTrashFile(file, false)}
                                      title="Restore"
                                    >
                                      <RotateCcw size={12} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Details Modal */}
      {detailsFile && (
        <FileDetailsModal
          file={detailsFile}
          onClose={() => setDetailsFile(null)}
          onPreview={(f) => {
            setDetailsFile(null);
            onPreviewFile(f);
          }}
          onDownload={handleDownloadFile}
          onTrash={(f) => handleTrashFile(f, true)}
        />
      )}

      {/* Move File Modal */}
      {moveFile && (
        <MoveFileModal
          file={moveFile}
          folders={folders}
          onClose={() => setMoveFile(null)}
          onMove={handleMoveFile}
        />
      )}
    </div>
  );
}
