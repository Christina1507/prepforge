import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Bookmark,
  Trash2,
  Tag,
  Folder,
  X,
  Edit2,
  Save,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Note } from '../../types';

export function PersonalNotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Note editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTags, setEditTags] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await apiFetch<{ notes: Note[] }>('/api/notes');
      setNotes(res.notes);
      if (res.notes.length > 0 && !activeNote) {
        setActiveNote(res.notes[0]);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSelectNote = (n: Note) => {
    setActiveNote(n);
    setIsEditing(false);
  };

  const handleCreateNewNote = async () => {
    try {
      const res = await apiFetch<{ note: Note }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '## Overview\nDocument key insights, algorithms, and interview pointers here...\n\n```ts\n// Code snippet or query\n```',
          subject: 'General',
          topic: '',
          tags: 'interview,notes',
        }),
      });
      setNotes((prev) => [res.note, ...prev]);
      setActiveNote(res.note);
      setEditTitle(res.note.title);
      setEditContent(res.note.content);
      setEditSubject(res.note.subject || '');
      setEditTopic(res.note.topic || '');
      setEditCompany(res.note.company || '');
      setEditTags(res.note.tags || '');
      setIsEditing(true);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    try {
      const res = await apiFetch<{ note: Note }>(`/api/notes/${activeNote.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          subject: editSubject,
          topic: editTopic,
          company: editCompany,
          tags: editTags,
        }),
      });
      setActiveNote(res.note);
      setNotes((prev) => prev.map((n) => (n.id === res.note.id ? res.note : n)));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this note permanently?')) return;
    try {
      await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleToggleBookmark = async (note: Note) => {
    const nextVal = note.is_bookmarked === 1 ? 0 : 1;
    try {
      await apiFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_bookmarked: nextVal }),
      });
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_bookmarked: nextVal } : n)));
      if (activeNote?.id === note.id) {
        setActiveNote({ ...activeNote, is_bookmarked: nextVal });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const filtered = notes.filter((n) => {
    return (
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Personal Notes...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Personal Engineering Notes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Store technical notes, interview frameworks, company prep docs, and architectural decisions.
          </p>
        </div>

        <button
          onClick={handleCreateNewNote}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* 2-Column Note Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Notes List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((n) => {
              const isActive = activeNote?.id === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => handleSelectNote(n)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-secondary border-stone-400 dark:border-stone-600 shadow-2xs'
                      : 'bg-card border-border hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground truncate pr-2">
                      {n.title}
                    </span>
                    {n.is_bookmarked === 1 && (
                      <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {n.content.replace(/[#*`]/g, '')}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-2">
                    {n.subject && <span>{n.subject}</span>}
                    {n.company && <span>· {n.company}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note Content / Editor (8 Cols) */}
        <div className="lg:col-span-8">
          {activeNote ? (
            <div className="p-6 bg-card border border-border rounded-2xl space-y-5 min-h-[500px]">
              {/* Header Controls */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(activeNote)}
                    className="p-1.5 text-stone-400 hover:text-amber-500 transition-colors"
                    title={activeNote.is_bookmarked ? 'Remove bookmark' : 'Bookmark note'}
                  >
                    <Bookmark className={`w-4 h-4 ${activeNote.is_bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  <span className="text-[11px] font-mono text-stone-400">
                    Updated {activeNote.updated_at?.split(' ')[0] || 'Recently'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveNote}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditTitle(activeNote.title);
                        setEditContent(activeNote.content);
                        setEditSubject(activeNote.subject || '');
                        setEditTopic(activeNote.topic || '');
                        setEditCompany(activeNote.company || '');
                        setEditTags(activeNote.tags || '');
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-foreground rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View / Edit Mode */}
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full text-lg font-bold bg-transparent text-foreground focus:outline-none border-b border-stone-200 dark:border-stone-700 pb-2"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject (e.g. DBMS)"
                      className="px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="Company (optional)"
                      className="px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                      className="px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                    />
                  </div>

                  <textarea
                    rows={16}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-4 font-mono text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
                    placeholder="Write markdown notes..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {activeNote.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-1">
                      {activeNote.subject && <span>{activeNote.subject}</span>}
                      {activeNote.company && <span>· Company: {activeNote.company}</span>}
                      {activeNote.tags && <span>· Tags: {activeNote.tags}</span>}
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {activeNote.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-stone-400 bg-card border border-border rounded-2xl">
              Select or create a note to view and edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
