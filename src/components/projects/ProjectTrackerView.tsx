import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  ExternalLink,
  CheckCircle2,
  Circle,
  Github,
  Video,
  FileCode,
  Trash2,
  X,
  Code2,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Project } from '../../types';

export function ProjectTrackerView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Project Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: 'React, Node.js, TypeScript, PostgreSQL',
    github_url: '',
    live_url: '',
    status: 'IN PROGRESS' as any,
    architecture_notes: '',
    demo_url: '',
    interview_explanation: '',
  });

  const fetchProjects = async () => {
    try {
      const res = await apiFetch<{ projects: Project[] }>('/api/projects');
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggleChecklist = async (project: Project, key: string) => {
    let currentChecklist: Record<string, boolean> = {
      github: false,
      readme: false,
      deployment: false,
      architecture: false,
      demo_video: false,
      interview_explanation: false,
    };

    if (project.checklist_json) {
      try {
        currentChecklist = { ...currentChecklist, ...JSON.parse(project.checklist_json) };
      } catch (e) {}
    }

    currentChecklist[key] = !currentChecklist[key];

    try {
      await apiFetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ checklist_json: JSON.stringify(currentChecklist) }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, checklist_json: JSON.stringify(currentChecklist) } : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        description: '',
        tech_stack: 'React, Node.js, TypeScript, PostgreSQL',
        github_url: '',
        live_url: '',
        status: 'IN PROGRESS',
        architecture_notes: '',
        demo_url: '',
        interview_explanation: '',
      });
      fetchProjects();
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project record?')) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Projects Tracker...</div>;
  }

  const checklistItems = [
    { key: 'github', label: 'Clean GitHub Repo' },
    { key: 'readme', label: 'Detailed README & Setup' },
    { key: 'deployment', label: 'Live Deployment URL' },
    { key: 'architecture', label: 'Architecture Diagram' },
    { key: 'demo_video', label: 'Loom / Demo Video' },
    { key: 'interview_explanation', label: 'Interview Walkthrough Ready' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Engineering Projects Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build interview-ready technical depth. Ensure architecture diagrams, live demos, and trade-off explanations are sharp.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((proj) => {
          let checklist: Record<string, boolean> = {};
          try {
            if (proj.checklist_json) checklist = JSON.parse(proj.checklist_json);
          } catch (e) {}

          const completedCount = checklistItems.filter((i) => checklist[i.key] === true).length;
          const scorePercent = Math.round((completedCount / checklistItems.length) * 100);

          return (
            <div
              key={proj.id}
              className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between space-y-5 shadow-2xs group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      {proj.title}
                    </h3>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {proj.tech_stack}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-foreground">
                      {proj.status}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {proj.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {/* Links */}
                <div className="flex items-center gap-3 pt-1 text-xs">
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-foreground hover:text-stone-950 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Repository</span>
                    </a>
                  )}
                  {proj.live_url && (
                    <a
                      href={proj.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 hover:underline font-medium"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Demo Video</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Readiness Checklist */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Interview Readiness Checklist
                  </span>
                  <span className="font-mono text-stone-500 tabular-nums">
                    {completedCount} / {checklistItems.length} ({scorePercent}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {checklistItems.map((item) => {
                    const isChecked = checklist[item.key] === true;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleToggleChecklist(proj, item.key)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-medium'
                            : 'bg-secondary/40 border-stone-200 dark:border-stone-700 text-stone-500'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        )}
                        <span className="text-[11px] truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {proj.interview_explanation && (
                  <div className="p-3 bg-secondary/40 border border-stone-200/60 dark:border-stone-800 rounded-xl text-[11px] text-muted-foreground leading-normal">
                    <span className="font-semibold text-foreground">Talking Points: </span>
                    {proj.interview_explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Add Engineering Project
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Real-Time Collaborative Canvas Engine"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  placeholder="e.g. React, WebSockets, Go, Redis, Docker"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Description & Impact
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain system goals, problem solved, and technical throughput achievements..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.live_url}
                    onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Architecture & Design Trade-offs
                </label>
                <textarea
                  rows={2}
                  value={formData.architecture_notes}
                  onChange={(e) => setFormData({ ...formData, architecture_notes: e.target.value })}
                  placeholder="Explain why you chose this DB, handling network partitions, or caching layers..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Interview Explanation Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.interview_explanation}
                  onChange={(e) => setFormData({ ...formData, interview_explanation: e.target.value })}
                  placeholder="How will you introduce this project in 90 seconds to an interviewer?"
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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
