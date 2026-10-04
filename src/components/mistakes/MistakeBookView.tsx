import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  RotateCw,
  Search,
  Trash2,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Mistake } from '../../types';

export function MistakeBookView() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Add Mistake Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    problem_name: '',
    topic: 'Binary Search',
    mistake_desc: '',
    correct_approach: '',
    explanation: '',
    lesson_learned: '',
    confidence: 2,
    revision_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const fetchMistakes = async () => {
    try {
      const res = await apiFetch<{ mistakes: Mistake[] }>('/api/mistakes');
      setMistakes(res.mistakes);
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem_name.trim() || !formData.mistake_desc.trim()) return;

    try {
      await apiFetch('/api/mistakes', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        problem_name: '',
        topic: 'Binary Search',
        mistake_desc: '',
        correct_approach: '',
        explanation: '',
        lesson_learned: '',
        confidence: 2,
        revision_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });
      fetchMistakes();
    } catch (err) {
      console.error('Failed to add mistake:', err);
    }
  };

  const handleToggleResolved = async (id: string, current: number) => {
    const nextVal = current === 1 ? 0 : 1;
    try {
      await apiFetch(`/api/mistakes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_resolved: nextVal }),
      });
      setMistakes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_resolved: nextVal } : m))
      );
    } catch (err) {
      console.error('Failed to update mistake status:', err);
    }
  };

  const handleDeleteMistake = async (id: string) => {
    if (!window.confirm('Delete this mistake record?')) return;
    try {
      await apiFetch(`/api/mistakes/${id}`, { method: 'DELETE' });
      setMistakes((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete mistake:', err);
    }
  };

  const uniqueTopics = ['All', ...Array.from(new Set(mistakes.map((m) => m.topic)))];

  const filtered = mistakes.filter((m) => {
    const matchesTopic = selectedTopic === 'All' || m.topic === selectedTopic;
    const matchesSearch =
      !searchQuery ||
      m.problem_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mistake_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lesson_learned.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Mistake Book...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Mistake Book
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Transform errors into durable mastery. All recorded mistakes automatically enter the spaced revision queue.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record New Mistake</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-card border border-border rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mistakes by problem, error description, or lesson learned..."
            className="w-full text-xs bg-transparent text-foreground placeholder:text-stone-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg text-foreground focus:outline-none"
          >
            {uniqueTopics.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Topics' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistakes List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400 space-y-2 bg-card border border-border rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No mistakes logged matching your search. Log tough problems that gave you trouble.</p>
          </div>
        ) : (
          filtered.map((m) => {
            const isResolved = m.is_resolved === 1;

            return (
              <div
                key={m.id}
                className={`p-5 md:p-6 rounded-2xl border transition-all space-y-4 ${
                  isResolved
                    ? 'bg-stone-50/70 dark:bg-stone-900/20 border-stone-200/60 dark:border-stone-800/60 opacity-75'
                    : 'bg-card border-border shadow-2xs'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {m.problem_name}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        {m.topic}
                      </span>
                      {isResolved && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                      Next Revision Target: {m.revision_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleResolved(m.id, m.is_resolved)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                        isResolved
                          ? 'bg-stone-200 dark:bg-stone-800 text-foreground'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                    </button>

                    <button
                      onClick={() => handleDeleteMistake(m.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3-Section Breakdown: Error, Correct Approach, Lesson */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl space-y-1">
                    <span className="font-semibold text-rose-800 dark:text-rose-300 uppercase text-[10px] tracking-wider">
                      Mistake / What went wrong:
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {m.mistake_desc}
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-1">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 uppercase text-[10px] tracking-wider">
                      Correct Approach:
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {m.correct_approach}
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-1">
                    <span className="font-semibold text-amber-800 dark:text-amber-300 uppercase text-[10px] tracking-wider">
                      Lesson Learned:
                    </span>
                    <p className="text-foreground leading-relaxed">
                      {m.lesson_learned}
                    </p>
                  </div>
                </div>

                {m.explanation && (
                  <div className="text-xs text-muted-foreground italic pt-1">
                    <span className="font-medium text-stone-600 dark:text-stone-300">Why I got it wrong: </span>
                    {m.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Mistake Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Record Mistake in Log
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMistake} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Problem or Concept Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.problem_name}
                  onChange={(e) => setFormData({ ...formData, problem_name: e.target.value })}
                  placeholder="e.g. Search in Rotated Sorted Array"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Binary Search"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Revision Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.revision_date}
                    onChange={(e) => setFormData({ ...formData, revision_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-700 dark:text-rose-400 mb-1">
                  What Mistake Did You Make? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.mistake_desc}
                  onChange={(e) => setFormData({ ...formData, mistake_desc: e.target.value })}
                  placeholder="e.g. Handled boundary condition strictly with '<' instead of '<=', causing infinite loops on duplicates..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                  What is the Correct Approach? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.correct_approach}
                  onChange={(e) => setFormData({ ...formData, correct_approach: e.target.value })}
                  placeholder="e.g. Determine which half is strictly sorted first (nums[left] <= nums[mid]), then check if target is inside range..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Key Lesson Learned
                </label>
                <textarea
                  rows={2}
                  value={formData.lesson_learned}
                  onChange={(e) => setFormData({ ...formData, lesson_learned: e.target.value })}
                  placeholder="e.g. Always partition search space after validating which side maintains sorted invariants..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
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
                  Save to Mistake Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
