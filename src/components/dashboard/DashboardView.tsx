import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Building2,
  Code2,
  BookOpen,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ActiveView } from '../layout/Sidebar';
import { PlacementReadiness, TodayTask, RevisionItem, Mistake, Company } from '../../types';

interface DashboardViewProps {
  onNavigateToView: (view: ActiveView) => void;
  onOpenWhatToDo: () => void;
}

interface DashboardData {
  studentName: string;
  readiness: PlacementReadiness;
  today: {
    date: string;
    tasks: TodayTask[];
    completedCount: number;
    totalCount: number;
    currentStreak: number;
    studyMinutesTracked: number;
  };
  dueRevisions: RevisionItem[];
  recentMistakes: Mistake[];
  activeApps: Company[];
}

export function DashboardView({ onNavigateToView, onOpenWhatToDo }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch<DashboardData>('/api/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    if (!data) return;
    try {
      const res = await apiFetch<{ id: string; is_completed: number }>(`/api/today/tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });
      setData((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.today.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: res.is_completed } : t
        );
        const compCount = updatedTasks.filter((t) => t.is_completed === 1).length;
        return {
          ...prev,
          today: {
            ...prev.today,
            tasks: updatedTasks,
            completedCount: compCount,
          },
        };
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await apiFetch('/api/today/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          category: 'Preparation',
          duration_minutes: 25,
        }),
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-64" />
        <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-stone-200 dark:bg-stone-800 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const readinessBars = [
    { label: 'DSA & Algorithms', value: data.readiness.dsa, view: 'dsa' as ActiveView, color: 'bg-indigo-600 dark:bg-indigo-400' },
    { label: 'Core CS Foundations', value: data.readiness.coreCs, view: 'corecs' as ActiveView, color: 'bg-emerald-600 dark:bg-emerald-400' },
    { label: 'Aptitude & Reasoning', value: data.readiness.aptitude, view: 'aptitude' as ActiveView, color: 'bg-amber-600 dark:bg-amber-400' },
    { label: 'Engineering Projects', value: data.readiness.projects, view: 'projects' as ActiveView, color: 'bg-blue-600 dark:bg-blue-400' },
    { label: 'Communication & Verbal', value: data.readiness.communication, view: 'interviews' as ActiveView, color: 'bg-teal-600 dark:bg-teal-400' },
    { label: 'Resume & Portfolio', value: data.readiness.resume, view: 'resume' as ActiveView, color: 'bg-violet-600 dark:bg-violet-400' },
    { label: 'Mock Interviews', value: data.readiness.mockInterviews, view: 'interviews' as ActiveView, color: 'bg-rose-600 dark:bg-rose-400' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Editorial Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {getGreeting()}, {data.studentName.toUpperCase()}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Your placement preparation at a glance.
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track your journey: Learn · Practice · Track · Revise · Assess · Apply · Interview
          </p>
        </div>

        {/* Quick Streak & Time Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-secondary border border-border flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase tracking-wider">Streak</div>
              <div className="text-xs font-semibold text-foreground tabular-nums">
                {data.today.currentStreak} Days
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-secondary border border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase tracking-wider">Today Prep</div>
              <div className="text-xs font-semibold text-foreground tabular-nums">
                {data.today.studyMinutesTracked} Mins
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent "WHAT SHOULD I DO NOW?" Banner */}
      <div className="p-5 md:p-6 bg-stone-900 text-white dark:bg-[#162032] border border-stone-800 dark:border-stone-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Prep Advisor</span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            Unsure of your next study block?
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            Get an instant, minute-by-minute agenda calculated from your overdue spaced revisions, weak DSA patterns, and target company timelines.
          </p>
        </div>

        <button
          onClick={onOpenWhatToDo}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs rounded-xl transition-colors shrink-0 shadow-sm"
        >
          <Compass className="w-4 h-4 text-stone-950" />
          <span>WHAT SHOULD I DO NOW?</span>
        </button>
      </div>

      {/* 2-Column Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Placement Readiness & Today's Preparation (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 6: Placement Readiness */}
          <div className="p-5 md:p-6 bg-card border border-border rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Placement Readiness Index
                </h2>
                <p className="text-xs text-muted-foreground">
                  Calculated dynamically from real verified activity, problem submissions, and mock scores.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-foreground font-mono tabular-nums">
                  {data.readiness.overall}%
                </span>
                <div className="text-[10px] text-stone-400">Overall Readiness</div>
              </div>
            </div>

            <div className="space-y-3.5">
              {readinessBars.map((bar) => (
                <div
                  key={bar.label}
                  className="space-y-1.5 group cursor-pointer"
                  onClick={() => onNavigateToView(bar.view)}
                  title={`View ${bar.label} module`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                      {bar.label}
                    </span>
                    <span className="font-mono text-muted-foreground tabular-nums">
                      {bar.value}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                      style={{ width: `${Math.min(100, Math.max(4, bar.value))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Today's Preparation */}
          <div className="p-5 md:p-6 bg-card border border-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-foreground">
                  Today&apos;s Preparation
                </h2>
              </div>
              <div className="text-xs text-stone-500 tabular-nums">
                <span className="font-semibold text-foreground">
                  {data.today.completedCount}
                </span>{' '}
                of {data.today.totalCount} completed
              </div>
            </div>

            <div className="space-y-2">
              {data.today.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    task.is_completed === 1
                      ? 'bg-stone-50/80 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-800/60 text-stone-400 line-through'
                      : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/80 text-foreground hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {task.is_completed === 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {task.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-muted-foreground font-mono">
                      {task.duration_minutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Task */}
            {isAddingTask ? (
              <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Solve 2 Graph BFS problems)"
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-lg"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTask(true)}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 border border-dashed border-border rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preparation Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Spaced Revisions, Recent Mistakes & Active Apps (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 20: Spaced Revision Queue */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Revision Queue Due Today
                </h3>
              </div>
              <button
                onClick={() => onNavigateToView('revision')}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {data.dueRevisions.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                You&apos;re caught up with all revisions today. Nice work!
              </div>
            ) : (
              <div className="space-y-2">
                {data.dueRevisions.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onNavigateToView('revision')}
                    className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {rev.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {rev.category} · {rev.topic_or_subject}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded shrink-0">
                      Due Today
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 19: Mistake Book Preview */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Mistake Book Highlights
                </h3>
              </div>
              <button
                onClick={() => onNavigateToView('mistakes')}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>Full Book</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {data.recentMistakes.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                No unresolved mistakes logged. Log errors to schedule retention intervals.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentMistakes.map((mst) => (
                  <div
                    key={mst.id}
                    onClick={() => onNavigateToView('mistakes')}
                    className="p-3 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 cursor-pointer hover:border-stone-400 space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">
                        {mst.problem_name}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono shrink-0">
                        {mst.topic}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      <span className="font-medium text-rose-600 dark:text-rose-400">Error: </span>
                      {mst.mistake_desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 22: Target Companies Pipeline Status */}
          <div className="p-5 bg-card border border-border rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Target Applications Pipeline
                </h3>
              </div>
              <button
                onClick={() => onNavigateToView('companies')}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>Pipeline</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {data.activeApps.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onNavigateToView('companies')}
                  className="p-3 rounded-xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between cursor-pointer hover:border-stone-400 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {comp.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {comp.role}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-foreground shrink-0">
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
