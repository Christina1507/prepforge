import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Sparkles,
  HelpCircle,
  RotateCw,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { CoreSubject, CoreTopic } from '../../types';

export function CoreCSView() {
  const [subjects, setSubjects] = useState<CoreSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('cs_dbms');
  const [selectedTopic, setSelectedTopic] = useState<CoreTopic | null>(null);

  // AI explanation drawer
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch<{ subjects: CoreSubject[] }>('/api/corecs/subjects');
      setSubjects(res.subjects);
      if (res.subjects.length > 0 && !activeSubjectId) {
        setActiveSubjectId(res.subjects[0].id);
      }
    } catch (err) {
      console.error('Failed to load Core CS subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleToggleTopic = async (topicId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      await apiFetch(`/api/corecs/topics/${topicId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchSubjects();
    } catch (err) {
      console.error('Failed to update topic status:', err);
    }
  };

  const handleExplainWithAI = async (topic: CoreTopic, subjectName: string) => {
    setSelectedTopic(topic);
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await apiFetch<{ content: string }>('/api/ai/explain', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.name,
          subject: subjectName,
          context: topic.key_concepts,
        }),
      });
      setAiExplanation(res.content);
    } catch (err: any) {
      setAiExplanation('Error fetching explanation. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Core CS Module...</div>;
  }

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Core Computer Science Foundations
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Master the academic subjects tested in technical screenings: DBMS, Operating Systems, Computer Networks, and OOP.
        </p>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200/60 dark:border-stone-800">
        {subjects.map((s) => {
          const isActive = s.id === activeSubjectId;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSubjectId(s.id);
                setAiExplanation(null);
                setSelectedTopic(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'bg-secondary/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span>{s.name}</span>
              <span className="font-mono text-[10px] opacity-80 tabular-nums">
                {s.percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Subject Content Layout */}
      {activeSubject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Topics List (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {activeSubject.name} Syllabus Checklist
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {activeSubject.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-foreground">
                    {activeSubject.completedCount}/{activeSubject.totalCount}
                  </div>
                  <div className="text-[10px] text-stone-400">Topics Done</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeSubject.topics.map((t) => {
                  const isDone = t.status === 'COMPLETED';
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-stone-50/70 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-800/60'
                          : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex items-start gap-3 cursor-pointer min-w-0 flex-1 select-none"
                          onClick={() => handleToggleTopic(t.id, t.status)}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold ${isDone ? 'text-stone-400 line-through' : 'text-foreground'}`}>
                              {t.name}
                            </div>
                            {t.key_concepts && (
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                {t.key_concepts}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleExplainWithAI(t, activeSubject.name)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-foreground bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-md shrink-0 transition-colors"
                          title="Generate AI summary & interview gotchas"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Explain</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Explanation / Topic Details Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-card border border-border rounded-2xl min-h-[380px] flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Topic Breakdown & Interview Notes
                  </h3>
                </div>
              </div>

              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-2 flex-1">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <div className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    Consulting Gemini Placement Coach...
                  </div>
                </div>
              ) : selectedTopic && aiExplanation ? (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">
                      {selectedTopic.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {activeSubject.name}
                    </span>
                  </div>

                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-stone-50/60 dark:bg-stone-900/40 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                    {aiExplanation}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-stone-400 space-y-2 flex-1 flex flex-col items-center justify-center">
                  <HelpCircle className="w-7 h-7 text-stone-300" />
                  <p>Click &quot;Explain&quot; on any topic above to view step-by-step mechanics, architecture insights, and top interview gotchas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
