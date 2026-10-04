import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { TodayTask } from '../../types';
import { ActiveView } from '../layout/Sidebar';

interface TodayPrepViewProps {
  onNavigateToView: (view: ActiveView) => void;
  onOpenWhatToDo: () => void;
}

export function TodayPrepView({ onNavigateToView, onOpenWhatToDo }: TodayPrepViewProps) {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCat, setNewTaskCat] = useState('DSA');
  const [newTaskDuration, setNewTaskDuration] = useState(25);

  // Focus Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);

  const fetchTasks = async () => {
    try {
      const res = await apiFetch<{ tasks: TodayTask[] }>('/api/today');
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load today tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Timer loop
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await apiFetch<{ id: string; is_completed: number }>(`/api/today/tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: res.is_completed } : t))
      );
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
          category: newTaskCat,
          duration_minutes: newTaskDuration,
        }),
      });
      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiFetch(`/api/today/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const resetTimer = (mins: number) => {
    setIsTimerRunning(false);
    setInitialMinutes(mins);
    setTimerSeconds(mins * 60);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Today&apos;s Preparation...</div>;
  }

  const completedCount = tasks.filter((t) => t.is_completed === 1).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Today&apos;s Preparation Plan
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Focus blocks, study timers, and milestone completion for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>

        <button
          onClick={onOpenWhatToDo}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Intelligent Auto-Scheduler</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tasks List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 md:p-6 bg-[#FDFCFA] dark:bg-[#111726] border border-stone-200/80 dark:border-stone-800 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Daily Focus Checklist
              </span>
              <span className="text-xs font-mono font-medium text-stone-700 dark:text-stone-300">
                {completedCount} / {tasks.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    task.is_completed === 1
                      ? 'bg-stone-50/70 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-800/60 text-stone-400 line-through'
                      : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-stone-300 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 select-none pr-3"
                  >
                    {task.is_completed === 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {task.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 font-mono text-stone-600 dark:text-stone-300">
                      {task.duration_minutes}m
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-3">
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add custom task (e.g. Solve 2 Hard DP problems)"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={newTaskCat}
                    onChange={(e) => setNewTaskCat(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="DSA">DSA</option>
                    <option value="Core CS">Core CS</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="SQL">SQL</option>
                    <option value="Projects">Projects</option>
                    <option value="Interview">Interview</option>
                  </select>

                  <select
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 focus:outline-none font-mono"
                  >
                    <option value={15}>15 mins</option>
                    <option value={25}>25 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Focus Deep-Work Timer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-[#FDFCFA] dark:bg-[#111726] border border-stone-200/80 dark:border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 shadow-2xs">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">
                Pomodoro Focus Timer
              </span>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Single-Task Deep Work
              </h2>
            </div>

            {/* Digital Clock */}
            <div className="text-5xl md:text-6xl font-extrabold font-mono text-stone-900 dark:text-stone-100 tabular-nums tracking-tight">
              {formatTimer(timerSeconds)}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => resetTimer(m)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    initialMinutes === m
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Block'}</span>
              </button>

              <button
                onClick={() => resetTimer(initialMinutes)}
                className="p-2.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
