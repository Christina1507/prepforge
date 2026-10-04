import React, { useState, useEffect } from 'react';
import {
  Mic,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Award,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { InterviewQuestion, MockInterview } from '../../types';

export function InterviewPrepView() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [mocks, setMocks] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bank' | 'mocks'>('bank');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add Mock Session Modal
  const [isAddMockOpen, setIsAddMockOpen] = useState(false);
  const [mockForm, setMockForm] = useState({
    company_name: '',
    role: 'SDE-1',
    interview_date: new Date().toISOString().split('T')[0],
    technical_score: 8,
    communication_score: 7,
    problem_solving_score: 8,
    confidence: 4,
    feedback: '',
    improvement_areas: '',
  });

  const fetchData = async () => {
    try {
      const [qRes, mRes] = await Promise.all([
        apiFetch<{ questions: InterviewQuestion[] }>('/api/interview/questions'),
        apiFetch<{ mocks: MockInterview[] }>('/api/interview/mocks'),
      ]);
      setQuestions(qRes.questions);
      setMocks(mRes.mocks);
    } catch (err) {
      console.error('Failed to load interview prep data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (qId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/interview/questions/${qId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, status: newStatus as any } : q))
      );
    } catch (err) {
      console.error('Failed to update question status:', err);
    }
  };

  const handleAddMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockForm.company_name.trim()) return;

    try {
      await apiFetch('/api/interview/mocks', {
        method: 'POST',
        body: JSON.stringify(mockForm),
      });
      setIsAddMockOpen(false);
      setMockForm({
        company_name: '',
        role: 'SDE-1',
        interview_date: new Date().toISOString().split('T')[0],
        technical_score: 8,
        communication_score: 7,
        problem_solving_score: 8,
        confidence: 4,
        feedback: '',
        improvement_areas: '',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add mock interview session:', err);
    }
  };

  const categories = [
    'All',
    'TECHNICAL INTERVIEW',
    'BEHAVIORAL INTERVIEW',
    'PROJECT INTERVIEW',
    'HR INTERVIEW',
  ];

  const filteredQuestions = questions.filter(
    (q) => selectedCategory === 'All' || q.category === selectedCategory
  );

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Interview Prep...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Interview Question Bank & Mock Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Technical deep-dives, behavioral STAR responses, and self-evaluated mock interview performance debriefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 bg-secondary rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'bank'
                  ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs'
                  : 'text-muted-foreground'
              }`}
            >
              Question Bank
            </button>
            <button
              onClick={() => setActiveTab('mocks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'mocks'
                  ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs'
                  : 'text-muted-foreground'
              }`}
            >
              Mock Log ({mocks.length})
            </button>
          </div>

          {activeTab === 'mocks' && (
            <button
              onClick={() => setIsAddMockOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Mock Session</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                {c === 'All' ? 'All Questions' : c}
              </button>
            ))}
          </div>

          {/* Question Cards */}
          <div className="space-y-3.5">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;

              return (
                <div
                  key={q.id}
                  className="p-5 bg-card border border-border rounded-2xl space-y-3 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                        <span>{q.category}</span>
                        <span>·</span>
                        <span>{q.difficulty}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-semibold bg-secondary border border-stone-200 dark:border-stone-700 rounded-lg text-foreground focus:outline-none"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Practicing">Practicing</option>
                        <option value="Can Explain">Can Explain</option>
                        <option value="Mastered">Mastered</option>
                      </select>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                        title="Toggle model answer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && q.sample_answer && (
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 text-xs text-foreground leading-relaxed bg-stone-50/60 dark:bg-stone-900/40 p-4 rounded-xl">
                      <span className="font-semibold text-foreground block mb-1">
                        High-Impact Sample Answer & Strategy:
                      </span>
                      {q.sample_answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'mocks' && (
        <div className="space-y-6">
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 rounded-xl text-xs text-stone-500">
            Note: Scores recorded below are user-entered self-assessments or peer feedback scores designed to monitor preparation velocity, not objective hiring predictions.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mocks.map((m) => (
              <div
                key={m.id}
                className="p-5 md:p-6 bg-card border border-border rounded-2xl space-y-4 shadow-2xs"
              >
                <div className="flex items-start justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {m.company_name}
                    </h3>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      {m.role} · {m.interview_date}
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Confidence: {m.confidence}/5
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-border">
                    <div className="text-[10px] text-stone-400 font-mono uppercase">Technical</div>
                    <div className="text-base font-bold font-mono text-foreground tabular-nums">
                      {m.technical_score}/10
                    </div>
                  </div>
                  <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-border">
                    <div className="text-[10px] text-stone-400 font-mono uppercase">Comm</div>
                    <div className="text-base font-bold font-mono text-foreground tabular-nums">
                      {m.communication_score}/10
                    </div>
                  </div>
                  <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-border">
                    <div className="text-[10px] text-stone-400 font-mono uppercase">Problem Solving</div>
                    <div className="text-base font-bold font-mono text-foreground tabular-nums">
                      {m.problem_solving_score}/10
                    </div>
                  </div>
                </div>

                {m.feedback && (
                  <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    <span className="font-semibold text-foreground">Feedback: </span>
                    {m.feedback}
                  </div>
                )}

                {m.improvement_areas && (
                  <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                    <span className="font-semibold">Improvement Areas: </span>
                    {m.improvement_areas}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Mock Modal */}
      {isAddMockOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Log Mock Interview Session
              </h3>
              <button onClick={() => setIsAddMockOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMock} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Company Simulation *
                  </label>
                  <input
                    type="text"
                    required
                    value={mockForm.company_name}
                    onChange={(e) => setMockForm({ ...mockForm, company_name: e.target.value })}
                    placeholder="e.g. Google Mock R1"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={mockForm.role}
                    onChange={(e) => setMockForm({ ...mockForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Technical (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={mockForm.technical_score}
                    onChange={(e) => setMockForm({ ...mockForm, technical_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Comm (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={mockForm.communication_score}
                    onChange={(e) => setMockForm({ ...mockForm, communication_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Problem Solving
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={mockForm.problem_solving_score}
                    onChange={(e) => setMockForm({ ...mockForm, problem_solving_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Interviewer Feedback Notes
                </label>
                <textarea
                  rows={2}
                  value={mockForm.feedback}
                  onChange={(e) => setMockForm({ ...mockForm, feedback: e.target.value })}
                  placeholder="Key positive feedback received during session..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Improvement Areas To Polish
                </label>
                <textarea
                  rows={2}
                  value={mockForm.improvement_areas}
                  onChange={(e) => setMockForm({ ...mockForm, improvement_areas: e.target.value })}
                  placeholder="e.g. State time complexity explicitly before implementing code..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddMockOpen(false)}
                  className="px-4 py-2 text-xs text-muted-foreground hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 text-white rounded-lg"
                >
                  Save Mock Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
