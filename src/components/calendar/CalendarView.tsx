import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { CalendarEvent } from '../../types';

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Add Event Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Assessment',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    notes: '',
  });

  const fetchEvents = async () => {
    try {
      const res = await apiFetch<{ events: CalendarEvent[] }>('/api/calendar/events');
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date) return;

    try {
      await apiFetch('/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        category: 'Assessment',
        event_date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        notes: '',
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to add calendar event:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiFetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete calendar event:', err);
    }
  };

  const categories = [
    'All',
    'Assessment',
    'Interview',
    'DSA Test',
    'Aptitude Test',
    'Company Deadline',
    'Study Session',
    'Revision',
    'Project Work',
  ];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Assessment':
        return 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
      case 'Interview':
        return 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
      case 'DSA Test':
        return 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300';
      case 'Company Deadline':
        return 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300';
      default:
        return 'border-stone-300 bg-stone-50 dark:bg-stone-800 text-foreground';
    }
  };

  const filtered = events.filter((e) => selectedCategory === 'All' || e.category === selectedCategory);

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Calendar...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Placement Event & Study Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Keep track of online tests, company deadlines, mock assessments, and interview rounds.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === c
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs font-semibold'
                : 'bg-secondary text-muted-foreground hover:bg-stone-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400 bg-card border border-border rounded-2xl">
            No events scheduled matching this category.
          </div>
        ) : (
          filtered.map((event) => {
            const colorClass = getCategoryColor(event.category);

            return (
              <div
                key={event.id}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs ${colorClass}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {event.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 font-bold">
                      {event.category}
                    </span>
                  </div>
                  {event.notes && (
                    <p className="text-xs opacity-90 leading-relaxed">
                      {event.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono text-xs">
                    <div className="font-semibold">{event.event_date}</div>
                    {event.start_time && (
                      <div className="text-[11px] opacity-75">
                        {event.start_time} {event.end_time ? `- ${event.end_time}` : ''}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1.5 opacity-60 hover:opacity-100 transition-opacity"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Schedule Placement Event
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Amazon Online Assessment (OA)"
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
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Preparation Notes / Test Portal Link
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Test instructions, platform link, webcam verification reminders..."
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
