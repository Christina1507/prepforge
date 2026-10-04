import React, { useState, useEffect } from 'react';
import {
  Repeat,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Calendar,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Habit } from '../../types';

interface HabitCompletionRecord {
  habit_id: string;
  completed_date: string;
}

export function HabitTrackerView() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Habit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'DSA',
    goal_days_per_week: 7,
    color: 'indigo',
    icon: 'CheckCircle2',
  });

  const fetchHabits = async () => {
    try {
      const res = await apiFetch<{ habits: Habit[]; completions: HabitCompletionRecord[] }>('/api/habits');
      setHabits(res.habits);
      setCompletions(res.completions);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: string, date: string) => {
    try {
      await apiFetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await apiFetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await apiFetch('/api/habits', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        description: '',
        category: 'DSA',
        goal_days_per_week: 7,
        color: 'indigo',
        icon: 'CheckCircle2',
      });
      fetchHabits();
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  };

  // Generate last 7 days array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const completionSet = new Set(completions.map((c) => `${c.habit_id}_${c.completed_date}`));

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Habit Tracker...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Preparation Habit System
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build compounding consistency without punitive pressure. Daily small efforts yield campus placement breakthroughs.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Habit</span>
        </button>
      </div>

      {/* Habits List with 7-Day Consistency Matrix */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 md:p-6 border-b border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Active Habits ({habits.length})
          </span>
          <span className="text-[11px] text-stone-400 font-mono">
            Past 7 Days History
          </span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
          {habits.map((h) => {
            return (
              <div
                key={h.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                {/* Left: Habit Info */}
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {h.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono uppercase">
                      {h.category}
                    </span>
                  </div>
                  {h.description && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {h.description}
                    </p>
                  )}
                  <div className="text-[10px] text-stone-400 font-mono">
                    Total completions: {h.total_completions || 0} times
                  </div>
                </div>

                {/* Right: 7-Day Checkboxes & Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {last7Days.map((d) => {
                      const isDone = completionSet.has(`${h.id}_${d}`);
                      const isToday = d === todayStr;
                      const dateObj = new Date(d);
                      const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];

                      return (
                        <div key={d} className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono text-stone-400">{dayLetter}</span>
                          <button
                            onClick={() => handleToggleHabit(h.id, d)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : isToday
                                ? 'border border-dashed border-stone-400 dark:border-stone-600 hover:border-stone-800 text-stone-400'
                                : 'bg-secondary/80 text-stone-400 hover:bg-stone-200'
                            }`}
                            title={`Toggle completion for ${d}`}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(h.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Habit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Create Preparation Habit
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Read 1 System Architecture Whitepaper"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Understand consistency models and fault tolerance"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
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
                    <option value="Aptitude">Aptitude</option>
                    <option value="SQL">SQL</option>
                    <option value="Projects">Projects</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Target Days/Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={formData.goal_days_per_week}
                    onChange={(e) => setFormData({ ...formData, goal_days_per_week: Number(e.target.value) })}
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
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
