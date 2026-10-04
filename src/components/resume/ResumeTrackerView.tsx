import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Circle,
  Save,
  AlertCircle,
  Sparkles,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { ResumeData } from '../../types';

export function ResumeTrackerView() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form states
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [skillsSummary, setSkillsSummary] = useState('');
  const [projectsHighlight, setProjectsHighlight] = useState('');
  const [certifications, setCertifications] = useState('');
  const [notes, setNotes] = useState('');

  const fetchResume = async () => {
    try {
      const res = await apiFetch<{ resume: ResumeData }>('/api/resume');
      setResume(res.resume);
      if (res.resume) {
        setSkillsSummary(res.resume.skills_summary || '');
        setProjectsHighlight(res.resume.projects_highlight || '');
        setCertifications(res.resume.certifications || '');
        setNotes(res.resume.notes || '');
        if (res.resume.checklist_json) {
          try {
            setChecklist(JSON.parse(res.resume.checklist_json));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to load resume data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const resumeChecklistItems = [
    { key: 'education', label: 'Education & Degree Dates', desc: 'College, B.Tech, CGPA, graduation month/year without gaps' },
    { key: 'skills', label: 'Technical Skills Categorized', desc: 'Languages, Databases, Frameworks, Core CS fundamentals' },
    { key: 'projects', label: '2-3 Strong Technical Projects', desc: 'Concrete metrics: latency reduced, throughput handled, architecture' },
    { key: 'internship', label: 'Work Experience / Internships', desc: 'Clear deliverables using active power verbs (Engineered, Architected)' },
    { key: 'achievements', label: 'Honors & Competitive Milestones', desc: 'Rankings in contests, hackathons, academic merit recognition' },
    { key: 'certifications', label: 'Relevant Cloud / Domain Certs', desc: 'AWS, GCP, Meta, or recognized industry credentials' },
    { key: 'github', label: 'Active GitHub Profile Link', desc: 'Clean pinned repositories with informative README files' },
    { key: 'linkedin', label: 'Updated LinkedIn Profile URL', desc: 'Matching dates and matching role titles' },
    { key: 'coding_profiles', label: 'LeetCode / GFG / Codeforces URL', desc: 'Verified contest rating and problem numbers' },
    { key: 'contact_info', label: 'Clean Contact Information', desc: 'Professional email address, phone number, location' },
    { key: 'formatting', label: 'Single Page Standard Format', desc: 'Standard margins (0.5"), clean sans-serif typography, PDF format' },
    { key: 'grammar', label: 'Grammar & Spellcheck Verified', desc: 'Zero typos, consistent bullet punctuation, consistent tenses' },
  ];

  const handleToggleItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await apiFetch('/api/resume', {
        method: 'PATCH',
        body: JSON.stringify({
          checklist_json: JSON.stringify(checklist),
          skills_summary: skillsSummary,
          projects_highlight: projectsHighlight,
          certifications,
          notes,
        }),
      });
      setSaveMessage('Resume tracker and preparation notes saved successfully.');
    } catch (err) {
      console.error('Failed to save resume:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Resume Tracker...</div>;
  }

  const completedCount = resumeChecklistItems.filter((i) => checklist[i.key] === true).length;
  const scorePercent = Math.round((completedCount / resumeChecklistItems.length) * 100);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Resume Preparation & Verification
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Section-by-section audit ensuring your engineering resume passes technical recruiter scrutiny.
          </p>
        </div>

        <button
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs">
          {saveMessage}
        </div>
      )}

      {/* Readiness Score Card */}
      <div className="p-5 md:p-6 bg-card border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Resume Checklist Audit
          </div>
          <div className="text-lg font-bold text-foreground">
            {completedCount} of {resumeChecklistItems.length} Checklist Requirements Satisfied
          </div>
          <p className="text-xs text-muted-foreground">
            {scorePercent === 100
              ? 'Your resume satisfies all canonical engineering criteria!'
              : 'Complete the remaining items below before applying to premier tier companies.'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-3xl font-extrabold font-mono text-foreground tabular-nums">
            {scorePercent}%
          </div>
          <div className="text-[11px] text-stone-400">Readiness Score</div>
        </div>
      </div>

      {/* 12-Point Checklist Grid */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Essential 12-Point Placement Standard Checklist
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {resumeChecklistItems.map((item) => {
            const isChecked = checklist[item.key] === true;

            return (
              <div
                key={item.key}
                onClick={() => handleToggleItem(item.key)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all select-none flex items-start gap-3 ${
                  isChecked
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-card border-border hover:border-stone-300'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                )}

                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold text-xs text-foreground">
                    {item.label}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume Content Sections & Bullet Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Skills Summary Content Block
          </label>
          <textarea
            rows={5}
            value={skillsSummary}
            onChange={(e) => setSkillsSummary(e.target.value)}
            placeholder="Languages: C++, Java, Python, TypeScript&#10;Databases: PostgreSQL, Redis, SQLite&#10;Frameworks: React, Express, Spring Boot&#10;Core: DSA, Operating Systems, Networks, DBMS"
            className="w-full p-3 font-mono text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
          />
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Featured Projects Resume Bullets
          </label>
          <textarea
            rows={5}
            value={projectsHighlight}
            onChange={(e) => setProjectsHighlight(e.target.value)}
            placeholder="• Engineered a distributed job queue supporting 5,000 req/sec with Redis streams.&#10;• Reduced database p99 query latency by 44% using covering B-tree indexes."
            className="w-full p-3 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
