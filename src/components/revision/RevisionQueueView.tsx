import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  X,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { RevisionItem } from '../../types';

export function RevisionQueueView() {
  const [dueToday, setDueToday] = useState<RevisionItem[]>([]);
  const [upcoming, setUpcoming] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active rating modal/item
  const [reviewingItem, setReviewingItem] = useState<RevisionItem | null>(null);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Core CS',
    topic_or_subject: 'DBMS',
    due_date: new Date().toISOString().split('T')[0],
  });

  const fetchRevisions = async () => {
    try {
      const res = await apiFetch<{ dueToday: RevisionItem[]; upcoming: RevisionItem[] }>('/api/revision');
      setDueToday(res.dueToday);
      setUpcoming(res.upcoming);
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const handleCompleteReview = async (rating: 'Forgot' | 'Shaky' | 'Good' | 'Easy') => {
    if (!reviewingItem) return;

    try {
      await apiFetch(`/api/revision/${reviewingItem.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      });
      setReviewingItem(null);
      fetchRevisions();
    } catch (err) {
      console.error('Failed to complete review:', err);
    }
  };

  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await apiFetch('/api/revision', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        category: 'Core CS',
        topic_or_subject: 'DBMS',
        due_date: new Date().toISOString().split('T')[0],
      });
      fetchRevisions();
    } catch (err) {
      console.error('Failed to add revision item:', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Revision Queue...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Spaced Repetition & Revision Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Science-backed spaced recall intervals ensure zero memory decay before campus assessment rounds.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Queue New Concept</span>
        </button>
      </div>

      {/* Due Today Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-400">
              Due Today ({dueToday.length})
            </h2>
          </div>
          <span className="text-xs text-stone-400">
            Complete spaced review to reset memory intervals
          </span>
        </div>

        {dueToday.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 bg-card border border-border rounded-2xl">
            You&apos;re completely caught up with today&apos;s revisions. Outstanding retention work!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dueToday.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white dark:bg-stone-800/80 border border-rose-300 dark:border-rose-900/60 rounded-2xl flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-rose-700 dark:text-rose-400">
                    <span>{item.category}</span>
                    <span>Rep: {item.repetitions}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {item.title}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {item.topic_or_subject}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-mono">
                    Current interval: {item.interval_days}d
                  </span>
                  <button
                    onClick={() => setReviewingItem(item)}
                    className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 rounded-lg transition-colors"
                  >
                    Review Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Revisions Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Upcoming Scheduled Revisions ({upcoming.length})
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 bg-card border border-border rounded-2xl">
            No upcoming revisions scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-card border border-border rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{item.category}</span>
                    <span>Due: {item.due_date}</span>
                  </div>
                  <h3 className="font-semibold text-xs text-foreground truncate">
                    {item.title}
                  </h3>
                  <div className="text-[11px] text-stone-500 truncate">
                    {item.topic_or_subject}
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 font-mono flex items-center justify-between">
                  <span>Interval: {item.interval_days} days</span>
                  <span>Rep: {item.repetitions}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spaced Repetition Review Assessment Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">
                Spaced Recall Rating
              </span>
              <h3 className="text-base font-bold text-foreground">
                {reviewingItem.title}
              </h3>
              <p className="text-xs text-stone-500">
                How accurately could you retrieve this concept or solution from memory without checking reference notes?
              </p>
            </div>

            {/* 4 SuperMemo Rating Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCompleteReview('Forgot')}
                className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100 text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-red-700 dark:text-red-400">
                  <Frown className="w-4 h-4" />
                  <span>Forgot</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Total blank. Reset to 1 day.
                </div>
              </button>

              <button
                onClick={() => handleCompleteReview('Shaky')}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-700 dark:text-amber-400">
                  <Meh className="w-4 h-4" />
                  <span>Shaky</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Hesitant recall. Review in 2-3 days.
                </div>
              </button>

              <button
                onClick={() => handleCompleteReview('Good')}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-700 dark:text-blue-400">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Good</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Accurate retrieval. Review in ~7 days.
                </div>
              </button>

              <button
                onClick={() => handleCompleteReview('Easy')}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                  <Smile className="w-4 h-4" />
                  <span>Easy</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Instant instinct. Push 14+ days.
                </div>
              </button>
            </div>

            <button
              onClick={() => setReviewingItem(null)}
              className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Revision Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Queue Item for Spaced Repetition
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRevision} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Concept or Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. TCP 3-Way Handshake & Teardown"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    <option value="DSA">DSA</option>
                    <option value="Core CS">Core CS</option>
                    <option value="SQL">SQL</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="System Design">System Design</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    First Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Subject or Module
                </label>
                <input
                  type="text"
                  value={formData.topic_or_subject}
                  onChange={(e) => setFormData({ ...formData, topic_or_subject: e.target.value })}
                  placeholder="e.g. Computer Networks"
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
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
