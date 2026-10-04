import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Save,
  Download,
  Trash2,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiFetch } from '../../services/api';

export function SettingsView() {
  const { profile, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [targetRole, setTargetRole] = useState(profile?.target_role || '');
  const [targetCompanies, setTargetCompanies] = useState(profile?.target_companies || '');
  const [dailyHours, setDailyHours] = useState(profile?.daily_prep_hours || 2.5);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        name,
        college,
        target_role: targetRole,
        target_companies: targetCompanies,
        daily_prep_hours: dailyHours,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [dashboard, dsa, notes, mistakes, companies] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/dsa/problems'),
        apiFetch('/api/notes'),
        apiFetch('/api/mistakes'),
        apiFetch('/api/companies'),
      ]);

      const exportObj = {
        exportDate: new Date().toISOString(),
        profile,
        dashboard,
        codingProblems: dsa.problems,
        notes: notes.notes,
        mistakes: mistakes.mistakes,
        companies: companies.companies,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `prepforge_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200/80 dark:border-stone-800 pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Workspace Settings & Profile
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Customize themes, target placement milestones, and export your personal preparation records.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Appearance & Themes */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Appearance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select between warm ivory light mode, deep navy dark mode, or follow your system preference.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {[
            { mode: 'light' as const, label: 'Light', desc: 'Warm ivory background, soft white cards, sage green accents', icon: Sun },
            { mode: 'dark' as const, label: 'Dark', desc: 'Deep navy background, dark slate cards, muted emerald accents', icon: Moon },
            { mode: 'system' as const, label: 'System', desc: 'Automatically adapt to your device OS appearance preference', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.mode;

            return (
              <label
                key={item.mode}
                onClick={() => setTheme(item.mode)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-secondary/80 font-medium shadow-2xs'
                    : 'border-border bg-card hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{item.label}</span>
                      {isSelected && (
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-normal">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name="theme-selection"
                    checked={isSelected}
                    onChange={() => setTheme(item.mode)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Student Profile Settings */}
      <form onSubmit={handleSaveProfile} className="p-6 bg-card border border-border rounded-2xl space-y-5 shadow-2xs">
        <h2 className="text-sm font-semibold text-foreground">
          Academic Profile & Career Targets
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              College / University
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Target Companies
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Daily Available Study Time: <span className="font-mono">{dailyHours} hours</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={6}
            step={0.5}
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Data Export & Account Actions */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-4 shadow-2xs">
        <h2 className="text-sm font-semibold text-foreground">
          Data Portability & Account
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-foreground">
              Export All Personal Preparation Data
            </div>
            <p className="text-[11px] text-muted-foreground">
              Download your full database: tracked problems, habits, notes, mistakes, and interview logs as JSON.
            </p>
          </div>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-secondary rounded-lg text-xs font-semibold text-foreground transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Archive</span>
          </button>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Sign out of your active session on this device.
          </div>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
