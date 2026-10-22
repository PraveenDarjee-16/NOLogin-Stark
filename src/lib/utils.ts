import { FileCategory } from './types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)
  ) {
    return 'photos';
  }

  if (
    mimeType.startsWith('video/') ||
    ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)
  ) {
    return 'videos';
  }

  if (
    mimeType.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)
  ) {
    return 'music';
  }

  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('text') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    [
      'pdf',
      'doc',
      'docx',
      'txt',
      'rtf',
      'md',
      'csv',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'json',
      'xml',
    ].includes(ext)
  ) {
    return 'documents';
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'dmg', 'iso', 'exe', 'msi', 'apk'].includes(ext)) {
    return 'downloads';
  }

  return 'other';
}

export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    zip: 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

export function generateId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function broadcastFilesUpdated(details?: { filename?: string; action?: string }) {
  if (typeof window === 'undefined') return;
  try {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('stark_cloud_desktop');
      channel.postMessage({ type: 'FILES_UPDATED', timestamp: Date.now(), ...details });
      channel.close();
    }
  } catch {}
  try {
    localStorage.setItem('stark_files_updated', String(Date.now()));
  } catch {}
}

export function subscribeToFilesUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let channel: BroadcastChannel | null = null;
  try {
    if (window.BroadcastChannel) {
      channel = new BroadcastChannel('stark_cloud_desktop');
      channel.onmessage = (event) => {
        if (event.data?.type === 'FILES_UPDATED') {
          callback();
        }
      };
    }
  } catch {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'stark_files_updated') {
      callback();
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('focus', handleVisibility);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleVisibility);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
