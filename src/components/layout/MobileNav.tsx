import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Code2,
  Building2,
  MoreHorizontal,
  X,
  RotateCw,
  Cpu,
  Calculator,
  Database,
  Repeat,
  AlertTriangle,
  Library,
  FileText,
  FolderGit2,
  FileCheck,
  Mic,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
} from 'lucide-react';
import { ActiveView } from './Sidebar';

interface MobileNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

export function MobileNav({ activeView, setActiveView, isDrawerOpen, setIsDrawerOpen }: MobileNavProps) {
  const quickTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'today', label: 'Today', icon: CheckSquare },
    { id: 'dsa', label: 'DSA', icon: Code2 },
    { id: 'revision', label: 'Revise', icon: RotateCw },
    { id: 'companies', label: 'Companies', icon: Building2 },
  ];

  const allDrawerItems = [
    { id: 'corecs', label: 'Core CS Subjects', icon: Cpu },
    { id: 'aptitude', label: 'Aptitude & Verbal', icon: Calculator },
    { id: 'sql', label: 'SQL Practice', icon: Database },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'habits', label: 'Habit Tracker', icon: Repeat },
    { id: 'mistakes', label: 'Mistake Book', icon: AlertTriangle },
    { id: 'resources', label: 'Resource Library', icon: Library },
    { id: 'notes', label: 'Personal Notes', icon: FileText },
    { id: 'projects', label: 'My Projects', icon: FolderGit2 },
    { id: 'resume', label: 'Resume Tracker', icon: FileCheck },
    { id: 'interviews', label: 'Interview & Mocks', icon: Mic },
    { id: 'calendar', label: 'Prep Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'aicoach', label: 'AI Study Coach', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (≤ 15% mobile viewport cap) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 border-t border-border z-40 px-2 flex items-center justify-around backdrop-blur select-none">
        {quickTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveView(tab.id as ActiveView);
                setIsDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            isDrawerOpen
              ? 'text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="More navigation modules"
        >
          <MoreHorizontal className="w-4 h-4 mb-1" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Drawer Overlay for All Modules */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-card border-t border-border rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-semibold text-foreground text-sm">
                All Modules
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allDrawerItems.map((item) => {
                const Icon = item.icon as any;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id as ActiveView);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-left border text-xs transition-colors ${
                      isActive
                        ? 'bg-secondary border-primary/40 text-foreground font-medium shadow-2xs'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
