import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { DSATopic, CodingProblem } from '../../types';

export function DSADashboardView() {
  const [topics, setTopics] = useState<DSATopic[]>([]);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDiff, setSelectedDiff] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Problem Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'LeetCode',
    url: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    topic: 'Arrays',
    status: 'SOLVED' as any,
    time_taken_minutes: 25,
    hint_used: false,
    approach: '',
    complexity: 'O(N) time, O(1) space',
    notes: '',
    confidence: 4,
  });

  const fetchData = async () => {
    try {
      const [topicsRes, problemsRes] = await Promise.all([
        apiFetch<{ topics: DSATopic[] }>('/api/dsa/topics'),
        apiFetch<{ problems: CodingProblem[] }>('/api/dsa/problems'),
      ]);
      setTopics(topicsRes.topics);
      setProblems(problemsRes.problems);
    } catch (err) {
      console.error('Failed to load DSA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await apiFetch('/api/dsa/problems', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        platform: 'LeetCode',
        url: '',
        difficulty: 'Medium',
        topic: selectedTopic !== 'All' ? selectedTopic : 'Arrays',
        status: 'SOLVED',
        time_taken_minutes: 25,
        hint_used: false,
        approach: '',
        complexity: 'O(N) time, O(1) space',
        notes: '',
        confidence: 4,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add problem:', err);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!window.confirm('Delete this tracked problem?')) return;
    try {
      await apiFetch(`/api/dsa/problems/${id}`, { method: 'DELETE' });
      setProblems((prev) => prev.filter((p) => p.id !== id));
      fetchData();
    } catch (err) {
      console.error('Failed to delete problem:', err);
    }
  };

  const handleStatusChange = async (problemId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/dsa/problems/${problemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, status: newStatus as any } : p))
      );
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchesTopic = selectedTopic === 'All' || p.topic === selectedTopic;
    const matchesDiff = selectedDiff === 'All' || p.difficulty === selectedDiff;
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesDiff && matchesStatus && matchesSearch;
  });

  const totalSolved = problems.filter((p) => p.status === 'SOLVED' || p.status === 'MASTERED').length;

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading DSA Module...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            DSA Preparation & Problem Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            18 core placement patterns: solve, log complexity, review time spent, and maintain high confidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-lg text-xs font-semibold text-indigo-900 dark:text-indigo-300 tabular-nums">
            Total Solved: {totalSolved} Problems
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track New Problem</span>
          </button>
        </div>
      </div>

      {/* 18 Core DSA Topics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Topic Progress Matrix ({topics.length} Categories)
          </span>
          <span className="text-[11px] text-stone-400">
            Click any topic to filter logged problems
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {topics.map((t) => {
            const isSelected = selectedTopic === t.name;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTopic(isSelected ? 'All' : t.name)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-secondary/90 border-stone-400 dark:border-stone-500 shadow-2xs'
                    : 'bg-card border-border hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-xs text-foreground truncate pr-2">
                    {t.name}
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                    {t.percentage}%
                  </span>
                </div>

                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(3, t.percentage || 0))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>E: {t.easyCount || 0}</span>
                  <span>M: {t.mediumCount || 0}</span>
                  <span>H: {t.hardCount || 0}</span>
                  <span className="font-semibold text-foreground">
                    {t.solvedCount || 0}/{t.total_target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-card border border-border rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, approaches, notes..."
            className="w-full text-xs bg-transparent text-foreground placeholder:text-stone-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="All">All Topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="SOLVED">Solved</option>
            <option value="MASTERED">Mastered</option>
            <option value="NEEDS REVISION">Needs Revision</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="NOT STARTED">Not Started</option>
          </select>

          {(selectedTopic !== 'All' || selectedDiff !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTopic('All');
                setSelectedDiff('All');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Problem Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
        {filteredProblems.length === 0 ? (
          <div className="py-16 text-center text-xs text-stone-400 space-y-2">
            <Code2 className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No coding problems found matching your filters.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg font-medium text-xs"
            >
              Log First Problem
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-stone-50/50 dark:bg-stone-900/30 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Problem Name & Link</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Complexity / Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {filteredProblems.map((prob) => {
                  const diffColor =
                    prob.difficulty === 'Easy'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : prob.difficulty === 'Medium'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-rose-700 dark:text-rose-400';

                  return (
                    <tr
                      key={prob.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {prob.name}
                          </span>
                          {prob.url && (
                            <a
                              href={prob.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                              title="Open problem external URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-600 dark:text-stone-300 font-medium">
                        {prob.topic}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {prob.platform}
                      </td>

                      <td className={`py-3 px-4 font-semibold font-mono ${diffColor}`}>
                        {prob.difficulty}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={prob.status}
                          onChange={(e) => handleStatusChange(prob.id, e.target.value)}
                          className="px-2 py-1 text-[11px] font-medium bg-secondary border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none"
                        >
                          <option value="NOT STARTED">Not Started</option>
                          <option value="ATTEMPTED">Attempted</option>
                          <option value="SOLVED">Solved</option>
                          <option value="NEEDS REVISION">Needs Revision</option>
                          <option value="MASTERED">Mastered</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        {prob.complexity && (
                          <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded mr-1">
                            {prob.complexity}
                          </span>
                        )}
                        {prob.notes}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProblem(prob.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Problem Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Track Coding Problem
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProblem} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Problem Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Subarray Sum Equals K"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="CodeChef">CodeChef</option>
                    <option value="SkillRack">SkillRack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    <option value="SOLVED">Solved</option>
                    <option value="MASTERED">Mastered</option>
                    <option value="NEEDS REVISION">Needs Revision</option>
                    <option value="ATTEMPTED">Attempted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Problem URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Time Taken (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.time_taken_minutes}
                    onChange={(e) => setFormData({ ...formData, time_taken_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Complexity
                  </label>
                  <input
                    type="text"
                    value={formData.complexity}
                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                    placeholder="e.g. O(N) time, O(1) space"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Key Approach & Revision Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Prefix sum hashmap tracking cumulative frequency count..."
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
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
