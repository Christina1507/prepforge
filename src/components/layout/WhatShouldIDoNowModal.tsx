import React, { useState } from 'react';
import { X, Clock, Compass, CheckCircle, ArrowRight, Loader2, Sparkles, Plus } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ActiveView } from './Sidebar';

interface WhatShouldIDoNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView: (view: ActiveView) => void;
  onRefreshDashboard?: () => void;
}

interface PlanItem {
  minutes: number;
  title: string;
  category: string;
  actionPrompt: string;
  reason: string;
}

interface PlanResult {
  totalDurationMinutes: number;
  rationale: string;
  items: PlanItem[];
}

export function WhatShouldIDoNowModal({
  isOpen,
  onClose,
  onNavigateToView,
  onRefreshDashboard,
}: WhatShouldIDoNowModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const handleGenerate = async (mins: number = selectedMinutes) => {
    setSelectedMinutes(mins);
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PlanResult>('/api/what-should-i-do-now', {
        method: 'POST',
        body: JSON.stringify({ availableMinutes: mins }),
      });
      setPlan(result);
      setAddedTasks({});
    } catch (err: any) {
      setError(err.message || 'Unable to generate preparation recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTodayTasks = async (item: PlanItem, index: number) => {
    try {
      await apiFetch('/api/today/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          category: item.category,
          duration_minutes: item.minutes,
        }),
      });
      setAddedTasks((prev) => ({ ...prev, [index]: true }));
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const getCategoryView = (cat: string): ActiveView => {
    const lower = cat.toLowerCase();
    if (lower.includes('dsa')) return 'dsa';
    if (lower.includes('cs') || lower.includes('dbms') || lower.includes('os')) return 'corecs';
    if (lower.includes('apt') || lower.includes('math')) return 'aptitude';
    if (lower.includes('sql')) return 'sql';
    if (lower.includes('interview')) return 'interviews';
    if (lower.includes('mistake')) return 'mistakes';
    if (lower.includes('rev')) return 'revision';
    return 'today';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-tight">
                What Should I Do Now?
              </h2>
              <p className="text-xs text-muted-foreground">
                Data-driven recommendation based on overdue revisions, weak topics, and active goals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duration Selector */}
        <div className="p-5 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
              Available Study Time:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleGenerate(mins)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors tabular-nums ${
                    selectedMinutes === mins
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <div className="text-sm font-medium text-foreground">
                Synthesizing your preparation queue...
              </div>
              <p className="text-xs text-stone-400 max-w-sm">
                Analyzing spaced revisions, weak DSA patterns, and target company criteria.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs space-y-2">
              <p>{error}</p>
              <button
                onClick={() => handleGenerate()}
                className="px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : plan ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                <span className="font-semibold">Why this agenda:</span> {plan.rationale}
              </div>

              <div className="space-y-3">
                {plan.items.map((item, index) => {
                  const targetView = getCategoryView(item.category);
                  const isAdded = addedTasks[index];

                  return (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-xl transition-all hover:border-stone-300 dark:hover:border-stone-600 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 tabular-nums">
                            {item.minutes} min
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddToTodayTasks(item, index)}
                            disabled={isAdded}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200'
                            }`}
                            title="Add to Today's Tasks list"
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Today</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              onNavigateToView(targetView);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="font-semibold text-sm text-foreground">
                        {item.title}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-normal">
                        {item.actionPrompt}
                      </p>

                      <div className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                        {item.reason}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <Compass className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-sm font-medium text-foreground">
                Ready to optimize your next study block
              </div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Select your available duration above and click to generate a custom-tailored schedule.
              </p>
              <button
                onClick={() => handleGenerate(selectedMinutes)}
                className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Generate Next {selectedMinutes} Minutes Plan
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Dynamically prioritized by PrepForge
          </span>
          <button
            onClick={() => handleGenerate(selectedMinutes)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-500" />
            <span>Regenerate Agenda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
