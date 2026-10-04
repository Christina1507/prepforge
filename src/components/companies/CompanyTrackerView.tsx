import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  X,
  FileText,
  DollarSign,
  GraduationCap,
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { Company } from '../../types';

export function CompanyTrackerView() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Add Company Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Software Development Engineer (SDE-1)',
    package_details: '₹24 - 36 LPA',
    eligibility: 'B.Tech CSE/IT, CGPA >= 7.5',
    application_date: new Date().toISOString().split('T')[0],
    assessment_date: '',
    interview_date: '',
    status: 'WISHLIST' as any,
    notes: '',
  });

  const fetchCompanies = async () => {
    try {
      const res = await apiFetch<{ companies: Company[] }>('/api/companies');
      setCompanies(res.companies);
      if (res.companies.length > 0 && !selectedCompany) {
        setSelectedCompany(res.companies[0]);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await apiFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        role: 'Software Development Engineer (SDE-1)',
        package_details: '₹24 - 36 LPA',
        eligibility: 'B.Tech CSE/IT, CGPA >= 7.5',
        application_date: new Date().toISOString().split('T')[0],
        assessment_date: '',
        interview_date: '',
        status: 'WISHLIST',
        notes: '',
      });
      fetchCompanies();
    } catch (err) {
      console.error('Failed to add company:', err);
    }
  };

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: newStatus as any } : c))
      );
      if (selectedCompany?.id === companyId) {
        setSelectedCompany((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      console.error('Failed to update company status:', err);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm('Delete this company target?')) return;
    try {
      await apiFetch(`/api/companies/${id}`, { method: 'DELETE' });
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      if (selectedCompany?.id === id) {
        setSelectedCompany(null);
      }
    } catch (err) {
      console.error('Failed to delete company:', err);
    }
  };

  const stages = [
    'WISHLIST',
    'APPLIED',
    'ONLINE ASSESSMENT',
    'TECHNICAL',
    'HR',
    'OFFER',
    'REJECTED',
  ];

  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-400">Loading Company Pipeline...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Target Companies & Application Pipeline
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track hiring rounds, eligibility cutoffs, CTC compensation packages, and curated company-specific preparation packs.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Target Company</span>
        </button>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Application Funnel ({companies.length} Total Opportunities)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {stages.map((stage) => {
            const inStage = companies.filter((c) => c.status === stage);

            return (
              <div
                key={stage}
                className="bg-stone-50/70 dark:bg-stone-900/40 border border-border rounded-xl p-3 flex flex-col space-y-2 min-h-[160px]"
              >
                <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-stone-600 dark:text-stone-300 truncate">
                    {stage}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-stone-500">
                    {inStage.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {inStage.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCompany(c)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedCompany?.id === c.id
                          ? 'bg-white dark:bg-stone-800 border-stone-400 dark:border-stone-500 shadow-2xs'
                          : 'bg-white dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700/60 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {c.role}
                      </div>
                      {c.package_details && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                          {c.package_details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Company Preparation Pack */}
      {selectedCompany && (
        <div className="p-6 md:p-8 bg-card border border-border rounded-2xl space-y-6 shadow-2xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-stone-900 flex items-center justify-center font-bold text-sm">
                  {selectedCompany.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedCompany.name} · Company Preparation Pack
                  </h2>
                  <div className="text-xs text-stone-500">
                    Role: {selectedCompany.role} {selectedCompany.package_details ? `· ${selectedCompany.package_details}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCompany.status}
                onChange={(e) => handleStatusChange(selectedCompany.id, e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
              >
                {stages.map((st) => (
                  <option key={st} value={st}>
                    Stage: {st}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleDeleteCompany(selectedCompany.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                title="Remove company"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 rounded-xl space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Eligibility & Cutoff Criteria
              </span>
              <div className="text-xs font-medium text-foreground">
                {selectedCompany.eligibility || 'Standard Engineering CGPA >= 7.0'}
              </div>
            </div>

            <div className="p-3.5 bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 rounded-xl space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Online Assessment Date
              </span>
              <div className="text-xs font-mono font-medium text-foreground">
                {selectedCompany.assessment_date || 'Pending Announcement'}
              </div>
            </div>

            <div className="p-3.5 bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800 rounded-xl space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Technical Interview Date
              </span>
              <div className="text-xs font-mono font-medium text-foreground">
                {selectedCompany.interview_date || 'Scheduled after assessment'}
              </div>
            </div>
          </div>

          {/* Section 23: Company Preparation Checklist & Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Company-Specific Strategy & Interview Notes
            </h3>

            <div className="p-4 bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {selectedCompany.notes || 'No specific interview rounds notes logged yet. Record topics frequently asked by this company.'}
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">
                Add Target Company to Pipeline
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Atlassian"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Graduate Software Engineer"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Package / CTC Details
                  </label>
                  <input
                    type="text"
                    value={formData.package_details}
                    onChange={(e) => setFormData({ ...formData, package_details: e.target.value })}
                    placeholder="e.g. ₹32 - 45 LPA"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Eligibility Criteria
                </label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. B.Tech CSE/IT, CGPA >= 7.5, zero active backlogs"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Assessment Date
                  </label>
                  <input
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Preparation Notes & Focus Areas
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Focus on Clean Architecture, Concurrency, and Values interview..."
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
                  Save Company Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
