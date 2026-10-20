'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Search,
  Clock,
  Check,
  AlertCircle,
  FileCode,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { CloudNote } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  onUnsavedChangeStatus?: (hasUnsaved: boolean) => void;
}

export default function TextSaverWindow({ onUnsavedChangeStatus }: Props) {
  const [notes, setNotes] = useState<CloudNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Save status: 'saved' | 'saving' | 'unsaved'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Unsaved dialog state
  const [pendingNoteSwitchId, setPendingNoteSwitchId] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Fetch notes from server
  const loadNotes = async () => {
    try {
      const res = await fetch(`/api/notes?trash=${showTrash}`);
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
        // If activeNote is no longer in list or not selected, select first on desktop screens
        if (!activeNoteId && data.notes.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          selectNote(data.notes[0]);
        } else if (activeNoteId) {
          const current = data.notes.find((n: CloudNote) => n.id === activeNoteId);
          if (current) {
            // Keep content intact if editing, otherwise sync
            if (saveStatus === 'saved') {
              setTitle(current.title);
              setContent(current.content);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [showTrash]);

  // Notify parent if unsaved changes exist
  useEffect(() => {
    onUnsavedChangeStatus?.(saveStatus === 'unsaved');
  }, [saveStatus, onUnsavedChangeStatus]);

  // Select note
  const selectNote = (note: CloudNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSaveStatus('saved');
  };

  const handleNoteClick = (targetId: string) => {
    if (targetId === activeNoteId) return;
    if (saveStatus === 'unsaved') {
      setPendingNoteSwitchId(targetId);
      setShowUnsavedPrompt(true);
    } else {
      const target = notes.find((n) => n.id === targetId);
      if (target) selectNote(target);
    }
  };

  // Create new note
  const handleCreateNew = async () => {
    if (saveStatus === 'unsaved') {
      const proceed = confirm('You have unsaved changes. Discard and create a new note?');
      if (!proceed) return;
    }

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        selectNote(data.note);
      }
    } catch (e) {
      console.error('Failed to create note:', e);
    }
  };

  // Save current note
  const handleSave = async () => {
    if (!activeNoteId) return;
    setSaveStatus('saving');

    try {
      const res = await fetch(`/api/notes/${activeNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Note',
          content,
        }),
      });

      const data = await res.json();
      if (data.note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === activeNoteId ? data.note : n))
        );
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Failed to save note:', e);
      setSaveStatus('unsaved');
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNoteId, title, content]);

  // Trash or restore note
  const handleTrashNote = async (id: string, trash: boolean) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrash: trash }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setTitle('');
        setContent('');
        setSaveStatus('saved');
      }
      loadNotes();
    } catch (e) {
      console.error('Failed to trash note:', e);
    }
  };

  // Permanently delete
  const handleDeletePermanently = async (id: string) => {
    if (!confirm('Warning: This will permanently delete this note. Proceed?')) return;
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setTitle('');
        setContent('');
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Permanent delete failed:', e);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  // Telemetry stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: '#020716',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar: Note List */}
      <aside
        style={{
          width: isMobile ? '100%' : '260px',
          minWidth: isMobile ? '100%' : '240px',
          display: isMobile && activeNoteId ? 'none' : 'flex',
          borderRight: isMobile ? 'none' : '1px solid var(--border-hud)',
          background: 'rgba(3, 10, 26, 0.85)',
          flexDirection: 'column',
          padding: '12px',
        }}
      >
        {/* Top Action & Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            className="holo-btn primary"
            style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem' }}
            onClick={handleCreateNew}
          >
            <Plus size={14} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            className="holo-input"
            style={{ padding: '6px 10px 6px 28px', fontSize: '0.78rem' }}
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
        </div>

        {/* View Switcher: Active / Trash */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px',
          }}
        >
          <button
            style={{
              background: !showTrash ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
              color: !showTrash ? 'var(--accent-cyan)' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-hud)',
            }}
            onClick={() => setShowTrash(false)}
          >
            Notes ({!showTrash ? filteredNotes.length : notes.length})
          </button>

          <button
            style={{
              background: showTrash ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
              color: showTrash ? '#fca5a5' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-hud)',
            }}
            onClick={() => setShowTrash(true)}
          >
            Trash
          </button>
        </div>

        {/* Notes List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              Accessing encrypted notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              {showTrash ? 'Trash bin is empty.' : 'No notes found. Click "New Note" to create one.'}
            </div>
          ) : (
            filteredNotes.map((n) => {
              const isSelected = n.id === activeNoteId;
              return (
                <div
                  key={n.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleNoteClick(n.id)}
                >
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '3px',
                    }}
                  >
                    {n.title || 'Untitled Note'}
                  </div>

                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-dim)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px',
                    }}
                  >
                    {n.content ? n.content.substring(0, 45) : '(Empty note)'}
                  </div>

                  <div
                    style={{
                      fontSize: '0.66rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{formatDate(n.updatedAt)}</span>
                    {!showTrash ? (
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrashNote(n.id, true);
                        }}
                        title="Move to Trash"
                      >
                        <Trash2 size={11} />
                      </button>
                    ) : (
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-cyan)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrashNote(n.id, false);
                        }}
                        title="Restore"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Note Editor View */}
      {/* Main Note Editor View */}
      <main
        style={{
          flex: 1,
          width: isMobile ? '100%' : undefined,
          display: isMobile && !activeNoteId ? 'none' : 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(2, 6, 18, 0.7)',
        }}
      >
        {activeNoteId ? (
          <>
            {/* Editor Toolbar */}
            <div
              style={{
                padding: isMobile ? '8px 12px' : '10px 18px',
                borderBottom: '1px solid var(--border-hud)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(3, 10, 26, 0.9)',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {isMobile && (
                <button
                  className="holo-btn"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                  onClick={() => {
                    if (saveStatus === 'unsaved') {
                      const discard = confirm('You have unsaved changes. Discard and return to notes list?');
                      if (!discard) return;
                    }
                    setActiveNoteId(null);
                  }}
                  title="Back to Notes List"
                >
                  <ArrowLeft size={13} />
                  <span>Notes</span>
                </button>
              )}
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus('unsaved');
                }}
                placeholder="Note title (e.g. qwer)..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'var(--font-hud)',
                  flex: 1,
                  minWidth: '200px',
                }}
              />

              {/* Actions & Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Save Status Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-hud)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background:
                      saveStatus === 'saved'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : saveStatus === 'saving'
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color:
                      saveStatus === 'saved'
                        ? '#34d399'
                        : saveStatus === 'saving'
                        ? 'var(--accent-cyan)'
                        : '#fbbf24',
                    border: `1px solid ${
                      saveStatus === 'saved'
                        ? '#059669'
                        : saveStatus === 'saving'
                        ? 'var(--accent-cyan)'
                        : '#d97706'
                    }`,
                  }}
                >
                  {saveStatus === 'saved' ? (
                    <>
                      <Check size={12} />
                      <span>SAVED // CLOUD SYNCED</span>
                    </>
                  ) : saveStatus === 'saving' ? (
                    <>
                      <Clock size={12} className="spin-slow" />
                      <span>SYNCING TO CLOUD...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      <span>UNSAVED CHANGES</span>
                    </>
                  )}
                </div>

                {/* Save Button */}
                <button
                  className="holo-btn primary"
                  onClick={handleSave}
                  title="Save Note (Ctrl+S)"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>

                {/* Trash Button */}
                {!showTrash ? (
                  <button
                    className="window-control-btn close"
                    onClick={() => handleTrashNote(activeNoteId, true)}
                    title="Move Note to Trash"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <>
                    <button
                      className="window-control-btn"
                      onClick={() => handleTrashNote(activeNoteId, false)}
                      title="Restore Note"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      className="window-control-btn close"
                      onClick={() => handleDeletePermanently(activeNoteId)}
                      title="Permanently Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Note Textarea Editor (No artificial character limit!) */}
            <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setSaveStatus('unsaved');
                }}
                placeholder="Type your notes, thoughts, and documents here without limits..."
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  lineHeight: '1.7',
                  resize: 'none',
                }}
              />
            </div>

            {/* Footer Telemetry Metrics */}
            <div
              style={{
                height: '32px',
                padding: '0 16px',
                background: 'rgba(3, 8, 22, 0.9)',
                borderTop: '1px solid var(--border-hud)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                WORDS: <strong style={{ color: 'var(--accent-cyan)' }}>{wordCount}</strong> //
                CHARS: <strong style={{ color: 'var(--accent-cyan)' }}>{charCount}</strong>
              </div>

              <div>
                {activeNote?.createdAt && (
                  <span>CREATED: {formatDate(activeNote.createdAt)} | </span>
                )}
                {lastSavedTime ? (
                  <span>LAST SAVED: {lastSavedTime}</span>
                ) : activeNote?.updatedAt ? (
                  <span>MODIFIED: {formatDate(activeNote.updatedAt)}</span>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          /* Empty selection state */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              gap: '14px',
              fontFamily: 'var(--font-hud)',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <FileCode size={48} style={{ opacity: 0.35, color: 'var(--accent-cyan)' }} />
            <div>TEXT SAVER // CLOUD NOTEPAD MATRIX</div>
            <div style={{ fontSize: '0.8rem', maxWidth: '340px', lineHeight: '1.5' }}>
              Select an existing note from the sidebar or click "New Note" to create a new persistent document.
            </div>
            <button className="holo-btn primary" onClick={handleCreateNew}>
              <Plus size={14} />
              <span>Create Note</span>
            </button>
          </div>
        )}
      </main>

      {/* Unsaved Warning Modal */}
      {showUnsavedPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="hologram-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '22px',
              background: 'rgba(6, 18, 42, 0.95)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', marginBottom: '12px', fontFamily: 'var(--font-hud)' }}>
              <AlertCircle size={18} />
              <span>UNSAVED CHANGES DETECTED</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              You have unsaved changes in <strong style={{ color: '#fff' }}>"{title || 'Untitled Note'}"</strong>. Would you like to save before switching?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="holo-btn"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  if (pendingNoteSwitchId) {
                    const target = notes.find((n) => n.id === pendingNoteSwitchId);
                    if (target) selectNote(target);
                  }
                  setPendingNoteSwitchId(null);
                }}
              >
                Discard
              </button>
              <button
                className="holo-btn primary"
                onClick={async () => {
                  await handleSave();
                  setShowUnsavedPrompt(false);
                  if (pendingNoteSwitchId) {
                    const target = notes.find((n) => n.id === pendingNoteSwitchId);
                    if (target) selectNote(target);
                  }
                  setPendingNoteSwitchId(null);
                }}
              >
                Save & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
