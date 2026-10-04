import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCw,
  AlertTriangle,
  Loader2,
  Send,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../../services/api';

export function AICoachView() {
  const [activeTool, setActiveTool] = useState<'study-plan' | 'explain' | 'quiz' | 'flashcards' | 'mistakes'>('study-plan');

  // Study Plan State
  const [minutes, setMinutes] = useState(60);
  const [studyPlanResult, setStudyPlanResult] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Explain Topic State
  const [explainTopic, setExplainTopic] = useState('B+ Tree Indexing');
  const [explainSubject, setExplainSubject] = useState('DBMS');
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Quiz State
  const [quizTopic, setQuizTopic] = useState('Sliding Window & Two Pointers');
  const [quizSubject, setQuizSubject] = useState('DSA');
  const [quizResult, setQuizResult] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Flashcards State
  const [fcTopic, setFcTopic] = useState('Operating System Deadlocks');
  const [fcSubject, setFcSubject] = useState('Operating Systems');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loadingFc, setLoadingFc] = useState(false);

  // Mistake Analysis State
  const [mistakeAnalysis, setMistakeAnalysis] = useState<any>(null);
  const [loadingMistakes, setLoadingMistakes] = useState(false);

  // Handlers
  const handleGenerateStudyPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await apiFetch('/api/ai/study-plan', {
        method: 'POST',
        body: JSON.stringify({ availableMinutes: minutes }),
      });
      setStudyPlanResult(res);
    } catch (err) {
      console.error('Study plan error:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleExplain = async () => {
    if (!explainTopic.trim()) return;
    setLoadingExplain(true);
    setExplainResult(null);
    try {
      const res = await apiFetch<{ content: string }>('/api/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ topic: explainTopic, subject: explainSubject }),
      });
      setExplainResult(res.content);
    } catch (err) {
      console.error('Explain error:', err);
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setLoadingQuiz(true);
    setQuizResult([]);
    setSelectedAnswers({});
    try {
      const res = await apiFetch<{ questions: any[] }>('/api/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({ topic: quizTopic, subject: quizSubject, count: 3 }),
      });
      setQuizResult(res.questions);
    } catch (err) {
      console.error('Quiz error:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!fcTopic.trim()) return;
    setLoadingFc(true);
    setFlashcards([]);
    try {
      const res = await apiFetch<{ flashcards: any[] }>('/api/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify({ topic: fcTopic, subject: fcSubject }),
      });
      setFlashcards(res.flashcards);
    } catch (err) {
      console.error('Flashcards error:', err);
    } finally {
      setLoadingFc(false);
    }
  };

  const handleAnalyzeMistakes = async () => {
    setLoadingMistakes(true);
    try {
      const res = await apiFetch('/api/ai/mistake-analysis', {
        method: 'POST',
      });
      setMistakeAnalysis(res);
    } catch (err) {
      console.error('Mistake analysis error:', err);
    } finally {
      setLoadingMistakes(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by Gemini 3.8 Flash</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          AI Placement & Study Coach
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Personalized guidance utilizing your active progress metrics, mistake history, and target companies.
        </p>
      </div>

      {/* Tool Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200/60 dark:border-stone-800">
        {[
          { id: 'study-plan', label: 'Study Planner', icon: Clock },
          { id: 'explain', label: 'Topic Explainer', icon: BookOpen },
          { id: 'quiz', label: 'Practice Quiz Generator', icon: HelpCircle },
          { id: 'flashcards', label: 'Flashcard Maker', icon: Zap },
          { id: 'mistakes', label: 'Mistake Diagnostics', icon: AlertTriangle },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'bg-secondary text-muted-foreground hover:bg-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool 1: Study Planner */}
      {activeTool === 'study-plan' && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Personalized Daily Study Planner
            </h2>
            <p className="text-xs text-stone-500">
              Synthesizes your overdue spaced revisions, weak DSA patterns, and target companies into a minute-by-minute schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground">
              Available Time:
            </span>
            {[30, 45, 60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg font-mono transition-colors ${
                  minutes === m
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs font-semibold'
                    : 'bg-secondary text-stone-600 dark:text-stone-300'
                }`}
              >
                {m}m
              </button>
            ))}

            <button
              onClick={handleGenerateStudyPlan}
              disabled={loadingPlan}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              {loadingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate Custom Plan</span>
            </button>
          </div>

          {studyPlanResult && (
            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
                <span className="font-semibold">Plan Rationale: </span>
                {studyPlanResult.rationale}
              </div>

              <div className="space-y-3">
                {studyPlanResult.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="font-mono text-stone-500 font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700">
                        {item.minutes} mins · {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      {item.actionPrompt}
                    </p>
                    <div className="text-[11px] text-stone-400 italic">
                      Why: {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 2: Topic Explainer */}
      {activeTool === 'explain' && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Technical Topic Explainer
            </h2>
            <p className="text-xs text-stone-500">
              Get an intuitive analogy, mechanical step-by-step breakdown, and the top 3 edge cases asked by interviewers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1">
                Topic Name
              </label>
              <input
                type="text"
                value={explainTopic}
                onChange={(e) => setExplainTopic(e.target.value)}
                placeholder="e.g. B+ Tree Indexing vs Hash Indexing"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Subject
              </label>
              <input
                type="text"
                value={explainSubject}
                onChange={(e) => setExplainSubject(e.target.value)}
                placeholder="e.g. DBMS"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleExplain}
            disabled={loadingExplain}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {loadingExplain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Explain Topic</span>
          </button>

          {explainResult && (
            <div className="p-5 bg-white dark:bg-stone-900/40 border border-border rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                AI Generated Explanation & Interview Edge Cases
              </span>
              <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {explainResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 3: Practice Quiz Generator */}
      {activeTool === 'quiz' && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              AI Placement Quiz Generator
            </h2>
            <p className="text-xs text-stone-500">
              Generate 3 challenging multiple-choice questions targeting your chosen topic.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Topic
              </label>
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Subject
              </label>
              <input
                type="text"
                value={quizSubject}
                onChange={(e) => setQuizSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={loadingQuiz}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {loadingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate Placement Quiz</span>
          </button>

          {quizResult.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-stone-100 dark:border-stone-800">
              {quizResult.map((q, qIndex) => {
                const selected = selectedAnswers[qIndex];
                return (
                  <div key={qIndex} className="p-4 bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl space-y-3">
                    <div className="text-xs font-semibold text-foreground">
                      {qIndex + 1}. {q.question}
                    </div>

                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D'].map((optKey) => {
                        const optText = q[`option${optKey}`];
                        const isCorrect = optKey === q.correctOption;
                        let btnStyle = 'border-stone-200 dark:border-stone-700 hover:bg-stone-50';

                        if (selected) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                          } else if (selected === optKey) {
                            btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                          }
                        }

                        return (
                          <button
                            key={optKey}
                            onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optKey }))}
                            className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center gap-2 transition-all ${btnStyle}`}
                          >
                            <span className="font-mono font-bold text-stone-500">{optKey}.</span>
                            <span>{optText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selected && (
                      <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-secondary/40 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 leading-normal">
                        <span className="font-semibold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tool 4: Flashcards */}
      {activeTool === 'flashcards' && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Flashcard Maker
            </h2>
            <p className="text-xs text-stone-500">
              Rapid recall cues designed for high-density interview facts and formulas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Topic
              </label>
              <input
                type="text"
                value={fcTopic}
                onChange={(e) => setFcTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Subject
              </label>
              <input
                type="text"
                value={fcSubject}
                onChange={(e) => setFcSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateFlashcards}
            disabled={loadingFc}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {loadingFc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate Flashcards</span>
          </button>

          {flashcards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              {flashcards.map((fc, i) => (
                <div key={i} className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-foreground">
                    Q: {fc.front}
                  </div>
                  <div className="text-xs text-foreground border-t border-stone-100 dark:border-stone-700/60 pt-2">
                    A: {fc.back}
                  </div>
                  {fc.tip && (
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded">
                      Hook: {fc.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tool 5: Mistake Diagnostics */}
      {activeTool === 'mistakes' && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Mistake Pattern Diagnostic
            </h2>
            <p className="text-xs text-stone-500">
              Gemini analyzes your logged Mistake Book entries to uncover recurring cognitive blind spots and recommend targeted drills.
            </p>
          </div>

          <button
            onClick={handleAnalyzeMistakes}
            disabled={loadingMistakes}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {loadingMistakes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>Run Mistake Diagnostic Report</span>
          </button>

          {mistakeAnalysis && (
            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl space-y-2">
                <span className="font-semibold text-xs text-rose-900 dark:text-rose-300">
                  Recurring Weakness Patterns:
                </span>
                <ul className="list-disc list-inside text-xs text-foreground space-y-1">
                  {mistakeAnalysis.recurringWeaknessPatterns?.map((pat: string, i: number) => (
                    <li key={i}>{pat}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-secondary/40 border border-border rounded-xl text-xs space-y-1 text-foreground leading-relaxed">
                <span className="font-semibold block text-foreground">Tactical Interview Advice:</span>
                <p>{mistakeAnalysis.tacticalAdvice}</p>
              </div>

              {mistakeAnalysis.recommendedPracticeSet && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Recommended Practice Problems: </span>
                  {mistakeAnalysis.recommendedPracticeSet.join(' · ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
