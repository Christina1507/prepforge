import React, { useState, useEffect } from 'react';
import {
  Library,
  Search,
  BookOpen,
  Bookmark,
  ExternalLink,
  Plus,
  Tag,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Resource } from '../../types';

export function ResourceLibraryView() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Add Resource Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ARTICLE' as any,
    subject: 'DSA',
    topic: '',
    difficulty: 'All Levels',
    url: '',
    tags: '',
    estimated_time_minutes: 20,
  });

  const fetchResources = async () => {
    try {
      const res = await apiFetch<{ resources: Resource[] }>('/api/resources');
      setResources(res.resources);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleToggleBookmark = async (resourceId: string) => {
    try {
      const res = await apiFetch<{ bookmarked: boolean }>(`/api/resources/${resourceId}/bookmark`, {
        method: 'POST',
      });
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, is_bookmarked: res.bookmarked ? 1 : 0 } : r))
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'ARTICLE',
        subject: 'DSA',
        topic: '',
        difficulty: 'All Levels',
        url: '',
        tags: '',
        estimated_time_minutes: 20,
      });
      fetchResources();
    } catch (err) {
      console.error('Failed to add resource:', err);
    }
  };

  const subjectHubs = [
    'All',
    'DSA',
    'DBMS',
    'OS',
    'Computer Networks',
    'OOP',
    'SQL',
    'Aptitude',
    'Interview Preparation',
    'Resume',
    'Projects',
    'Company Preparation',
  ];

  const resourceTypes = [
    'All',
    'PDF',
    'VIDEO',
    'ARTICLE',
    'WEBSITE',
    'GITHUB',
    'CHEAT SHEET',
    'NOTES',
    'PRACTICE',
    'INTERVIEW',
    'ROADMAP',
  ];

  const filtered = resources.filter((r) => {
    const matchesSubject = selectedSubject === 'All' || r.subject === selectedSubject;
    const matchesType = selectedType === 'All' || r.type === selectedType;
    const matchesBookmark = !showBookmarksOnly || r.is_bookmarked === 1;
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesType && matchesBookmark && matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Resource Library...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Placement Resource Library
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Curated roadmaps, cheat sheets, interview question sets, GitHub repositories, and personal study guides.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Subject Hubs Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {subjectHubs.map((hub) => (
            <button
              key={hub}
              onClick={() => setSelectedSubject(hub)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedSubject === hub
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs font-semibold'
                  : 'bg-secondary text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {hub}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="p-4 bg-card border border-border rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, concept, or tag..."
              className="w-full text-xs bg-transparent text-foreground placeholder:text-stone-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg text-foreground focus:outline-none"
            >
              {resourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Types' : t}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                showBookmarksOnly
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold'
                  : 'bg-white dark:bg-stone-800 border-border text-stone-600 dark:text-stone-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-stone-400 space-y-2">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No resources found matching your current filter criteria.</p>
          </div>
        ) : (
          filtered.map((res) => (
            <div
              key={res.id}
              className="p-5 bg-card border border-border rounded-2xl flex flex-col justify-between space-y-4 hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-2xs group"
            >
              <div className="space-y-2.5">
                {/* Clean unboxed metadata separator */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{res.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{res.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{res.difficulty}</span>
                  </div>

                  <button
                    onClick={() => handleToggleBookmark(res.id)}
                    className="p-1 text-stone-400 hover:text-amber-500 transition-colors shrink-0"
                    title={res.is_bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${res.is_bookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </button>
                </div>

                <h3 className="font-semibold text-sm text-foreground group-hover:text-stone-900 leading-snug">
                  {res.title}
                </h3>

                {res.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {res.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{res.estimated_time_minutes} min read</span>
                </span>

                {res.url && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-stone-800 hover:text-stone-950 dark:text-stone-200 dark:hover:text-white font-medium transition-colors"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Add Custom Resource to Library
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed System Consensus Algorithms"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Subject Hub
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    {subjectHubs.filter((h) => h !== 'All').map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Resource Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    {resourceTypes.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Resource URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description & Key Takeaways
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of concepts covered and why it is useful for interviews..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="consensus, paxos, distributed"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={formData.estimated_time_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_time_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-muted-foreground hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 text-white rounded-lg"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
