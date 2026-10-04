import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Code2,
  Cpu,
  Calculator,
  Database,
  Map,
  Repeat,
  AlertTriangle,
  RotateCw,
  Library,
  FileText,
  Building2,
  FolderGit2,
  FileCheck,
  Mic,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
  Flame,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveView =
  | 'dashboard'
  | 'today'
  | 'dsa'
  | 'corecs'
  | 'aptitude'
  | 'sql'
  | 'roadmaps'
  | 'habits'
  | 'mistakes'
  | 'revision'
  | 'resources'
  | 'notes'
  | 'companies'
  | 'projects'
  | 'resume'
  | 'interviews'
  | 'calendar'
  | 'analytics'
  | 'aicoach'
  | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  streakCount: number;
}

export function Sidebar({ activeView, setActiveView, streakCount }: SidebarProps) {
  const { profile, logout } = useAuth();

  const navGroups = [
    {
      label: 'Preparation Core',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'today', label: "Today's Plan", icon: CheckSquare },
        { id: 'dsa', label: 'DSA Module', icon: Code2 },
        { id: 'corecs', label: 'Core CS Subjects', icon: Cpu },
        { id: 'aptitude', label: 'Aptitude & Verbal', icon: Calculator },
        { id: 'sql', label: 'SQL Practice', icon: Database },
        { id: 'roadmaps', label: 'Learning Roadmaps', icon: Map },
      ],
    },
    {
      label: 'Consistency & Retention',
      items: [
        { id: 'habits', label: 'Habit Tracker', icon: Repeat },
        { id: 'mistakes', label: 'Mistake Book', icon: AlertTriangle },
        { id: 'revision', label: 'Spaced Revision', icon: RotateCw },
        { id: 'resources', label: 'Resource Library', icon: Library },
        { id: 'notes', label: 'Personal Notes', icon: FileText },
      ],
    },
    {
      label: 'Career & Placement',
      items: [
        { id: 'companies', label: 'Target Companies', icon: Building2 },
        { id: 'projects', label: 'My Projects', icon: FolderGit2 },
        { id: 'resume', label: 'Resume Tracker', icon: FileCheck },
        { id: 'interviews', label: 'Interview & Mocks', icon: Mic },
        { id: 'calendar', label: 'Prep Calendar', icon: Calendar },
      ],
    },
    {
      label: 'Intelligence & Growth',
      items: [
        { id: 'aicoach', label: 'AI Study Coach', icon: Sparkles },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-border bg-card shrink-0 overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              P
            </div>
            <div>
              <div className="font-semibold text-base tracking-tight text-foreground leading-tight">
                PrepForge
              </div>
              <div className="text-[11px] text-muted-foreground font-normal">
                Career Readiness
              </div>
            </div>
          </button>
        </div>

        {streakCount > 0 && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums" title={`${streakCount} day preparation streak`}>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{streakCount}d</span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as ActiveView)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Student Profile Footer */}
      <div className="p-3 border-t border-border bg-secondary/40">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center font-semibold text-xs shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {profile?.name || 'Student Engineer'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {profile?.target_role || 'SDE Aspirant'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
