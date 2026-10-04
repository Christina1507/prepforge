import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Code2, FileText, RotateCw, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ActiveView } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView: (view: ActiveView) => void;
}

interface SearchResults {
  topics: Array<{ title: string; category: string; description?: string; slug?: string }>;
  resources: Array<{ id: string; title: string; type: string; subject: string; url?: string; description?: string }>;
  practice: Array<{ id: string; title: string; difficulty: string; platform: string; status: string }>;
  notes: Array<{ id: string; title: string; subject?: string; topic?: string; content?: string }>;
  revisions: Array<{ id: string; title: string; category: string; due_date: string; topic_or_subject: string }>;
}

export function GlobalSearchModal({ isOpen, onClose, onNavigateToView }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    topics: [],
    resources: [],
    practice: [],
    notes: [],
    revisions: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ topics: [], resources: [], practice: [], notes: [], revisions: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ topics: [], resources: [], practice: [], notes: [], revisions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ results: SearchResults }>(
          `/api/resources/search?q=${encodeURIComponent(query.trim())}`
        );
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalHits =
    results.topics.length +
    results.resources.length +
    results.practice.length +
    results.notes.length +
    results.revisions.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 md:pt-24 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across topics, resources, coding problems, notes, revisions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-stone-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-secondary border border-stone-200 dark:border-stone-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-stone-400 space-y-2">
              <p>Type to search across everything in your preparation workspace.</p>
              <p className="text-stone-400">
                Examples: <span className="text-stone-600 dark:text-stone-300 font-mono">normalization</span>, <span className="text-stone-600 dark:text-stone-300 font-mono">sliding window</span>, <span className="text-stone-600 dark:text-stone-300 font-mono">transactions</span>, <span className="text-stone-600 dark:text-stone-300 font-mono">joins</span>
              </p>
            </div>
          ) : totalHits === 0 && !loading ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No matching topics, resources, notes, or revisions found for &quot;{query}&quot;.
            </div>
          ) : (
            <>
              {/* TOPICS */}
              {results.topics.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Topics ({results.topics.length})
                  </div>
                  <div className="space-y-1">
                    {results.topics.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onNavigateToView(t.category === 'DSA' ? 'dsa' : 'corecs');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-stone-400 uppercase font-mono">
                              {t.category}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {t.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RESOURCES */}
              {results.resources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Resources ({results.resources.length})
                  </div>
                  <div className="space-y-1">
                    {results.resources.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">
                              {r.title}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {r.type} · {r.subject}
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5 pl-5.5">
                              {r.description}
                            </p>
                          )}
                        </div>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white shrink-0"
                            title="Open external resource"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRACTICE / CODING PROBLEMS */}
              {results.practice.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Practice ({results.practice.length})
                  </div>
                  <div className="space-y-1">
                    {results.practice.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigateToView('dsa');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Code2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {p.title}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {p.difficulty} · {p.platform} · {p.status}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTES */}
              {results.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    My Notes ({results.notes.length})
                  </div>
                  <div className="space-y-1">
                    {results.notes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onNavigateToView('notes');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {n.title}
                          </span>
                          {n.subject && (
                            <span className="text-[10px] text-stone-400">
                              {n.subject}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* REVISIONS */}
              {results.revisions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Revision Queue ({results.revisions.length})
                  </div>
                  <div className="space-y-1">
                    {results.revisions.map((rev) => (
                      <button
                        key={rev.id}
                        onClick={() => {
                          onNavigateToView('revision');
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <RotateCw className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {rev.title}
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                            Due {rev.due_date}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
