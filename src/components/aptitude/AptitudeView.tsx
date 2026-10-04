import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BarChart,
  Target,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { AptitudeQuestion } from '../../types';

interface AptitudeStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  averageTimeSeconds: number;
  byCategory: Array<{ category: string; attempted: number; correct: number }>;
}

export function AptitudeView() {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [stats, setStats] = useState<AptitudeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Quiz active state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOption: string; explanation: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const fetchQuestionsAndStats = async (cat: string = selectedCategory) => {
    try {
      const qUrl = cat === 'All' ? '/api/aptitude/questions' : `/api/aptitude/questions?category=${encodeURIComponent(cat)}`;
      const [qRes, statsRes] = await Promise.all([
        apiFetch<{ questions: AptitudeQuestion[] }>(qUrl),
        apiFetch<AptitudeStats>('/api/aptitude/stats'),
      ]);
      setQuestions(qRes.questions);
      setStats(statsRes);
      setCurrentIndex(0);
      setSelectedOption(null);
      setResult(null);
      setTimerSeconds(0);
    } catch (err) {
      console.error('Failed to load aptitude questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndStats();
  }, [selectedCategory]);

  // Quiz timer
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, result]);

  const handleSelectOption = (opt: string) => {
    if (result) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || !currentQuestion || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ isCorrect: boolean; correctOption: string; explanation: string }>(
        '/api/aptitude/attempt',
        {
          method: 'POST',
          body: JSON.stringify({
            question_id: currentQuestion.id,
            selected_option: selectedOption,
            time_taken_seconds: timerSeconds,
          }),
        }
      );
      setResult(res);

      // Refresh stats
      const updatedStats = await apiFetch<AptitudeStats>('/api/aptitude/stats');
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to check answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setResult(null);
      setTimerSeconds(0);
    } else {
      // Re-fetch next batch
      fetchQuestionsAndStats();
    }
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Aptitude Module...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Aptitude, Reasoning & Verbal Practice
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Solve campus placement assessment questions with real-time timers and step-by-step mathematical explanations.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-lg shrink-0">
          {['All', 'Quantitative', 'Logical Reasoning', 'Verbal'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-stone-900 text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border border-border rounded-xl space-y-1">
            <div className="text-[11px] text-stone-500 uppercase tracking-wider">Attempted</div>
            <div className="text-xl font-bold font-mono text-foreground tabular-nums">
              {stats.totalAttempted}
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl space-y-1">
            <div className="text-[11px] text-stone-500 uppercase tracking-wider">Overall Accuracy</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.accuracy}%
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl space-y-1">
            <div className="text-[11px] text-stone-500 uppercase tracking-wider">Total Correct</div>
            <div className="text-xl font-bold font-mono text-foreground tabular-nums">
              {stats.totalCorrect}
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl space-y-1">
            <div className="text-[11px] text-stone-500 uppercase tracking-wider">Average Speed</div>
            <div className="text-xl font-bold font-mono text-foreground tabular-nums">
              {stats.averageTimeSeconds}s / question
            </div>
          </div>
        </div>
      )}

      {/* Interactive Quiz Card */}
      {currentQuestion ? (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          {/* Question Meta */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-secondary text-foreground font-mono">
                {currentQuestion.category} · {currentQuestion.topic}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-600 dark:text-stone-300 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-sm md:text-base font-semibold text-foreground leading-relaxed">
            {currentQuestion.question}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {[
              { key: 'A', text: currentQuestion.option_a },
              { key: 'B', text: currentQuestion.option_b },
              { key: 'C', text: currentQuestion.option_c },
              { key: 'D', text: currentQuestion.option_d },
            ].map((opt) => {
              const isSelected = selectedOption === opt.key;
              let optStyle = 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-stone-400';

              if (result) {
                if (opt.key === result.correctOption) {
                  optStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium';
                } else if (isSelected && !result.isCorrect) {
                  optStyle = 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200';
                } else {
                  optStyle = 'opacity-50 border-border';
                }
              } else if (isSelected) {
                optStyle = 'bg-stone-100 dark:bg-stone-700 border-stone-900 dark:border-white shadow-2xs';
              }

              return (
                <button
                  key={opt.key}
                  disabled={Boolean(result)}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all select-none ${optStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-700 flex items-center justify-center font-mono font-semibold text-foreground">
                      {opt.key}
                    </span>
                    <span className="text-foreground">{opt.text}</span>
                  </div>
                  {result && opt.key === result.correctOption && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {result && isSelected && !result.isCorrect && (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Button & Explanation */}
          <div className="pt-2">
            {!result ? (
              <button
                disabled={!selectedOption || submitting}
                onClick={handleCheckAnswer}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                {submitting ? 'Verifying Answer...' : 'Submit & Check Answer'}
              </button>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                    result.isCorrect
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                      : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {result.isCorrect ? 'Correct! Excellent speed.' : `Incorrect. The correct choice is (${result.correctOption}).`}
                  </div>
                  <p className="text-foreground">
                    <span className="font-medium">Step-by-step Solution: </span>
                    {result.explanation}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-stone-400 bg-card border border-border rounded-2xl">
          No aptitude questions currently loaded for this category.
        </div>
      )}
    </div>
  );
}
