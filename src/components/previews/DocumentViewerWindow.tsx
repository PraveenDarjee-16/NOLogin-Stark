'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, RefreshCw } from 'lucide-react';
import { CloudFile } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface Props {
  file: CloudFile;
}

export default function DocumentViewerWindow({ file }: Props) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPdf =
    file.mimeType === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  const isTextLike =
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'sh', 'csv', 'xml'].some(
      (ext) => file.name.toLowerCase().endsWith(`.${ext}`)
    );

  useEffect(() => {
    if (isTextLike && !isPdf) {
      setIsLoading(true);
      fetch(`/api/files/download/${encodeURIComponent(file.id)}?preview=true`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((text) => setTextContent(text))
        .catch((err) => setTextContent(`Error loading document content: ${err?.message}`))
        .finally(() => setIsLoading(false));
    }
  }, [file.id, isTextLike, isPdf]);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#020612',
      }}
    >
      {/* Top action toolbar */}
      <div
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(4, 12, 28, 0.9)',
          borderBottom: '1px solid var(--border-hud)',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-hud)' }}>
          {file.name} ({formatBytes(file.size)})
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isTextLike && textContent && (
            <button
              className="window-control-btn"
              onClick={handleCopy}
              title="Copy text to clipboard"
            >
              {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
            </button>
          )}

          <a
            href={`/api/files/download/${encodeURIComponent(file.id)}`}
            download={file.name}
            className="holo-btn"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            <Download size={13} />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {isPdf ? (
          <iframe
            src={`/api/files/download/${encodeURIComponent(file.id)}?preview=true`}
            title={file.name}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#fff',
            }}
          />
        ) : isTextLike ? (
          isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-hud)',
                gap: '8px',
              }}
            >
              <RefreshCw size={18} className="spin-slow" />
              <span>DECRYPTING TEXT STREAM...</span>
            </div>
          ) : (
            <pre
              style={{
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#e2e8f0',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {textContent}
            </pre>
          )
        ) : (
          /* Binary preview placeholder */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '24px',
              textAlign: 'center',
              gap: '16px',
            }}
          >
            <FileText size={56} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />
            <div style={{ fontFamily: 'var(--font-hud)', color: '#fff', fontSize: '1rem' }}>
              BINARY ARCHIVE PREVIEW UNAVAILABLE
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
              This file ({file.mimeType}) cannot be directly rendered inside the browser viewport. You can download and inspect it locally.
            </div>
            <a
              href={`/api/files/download/${encodeURIComponent(file.id)}`}
              download={file.name}
              className="holo-btn primary"
            >
              <Download size={15} />
              <span>Download File ({formatBytes(file.size)})</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
