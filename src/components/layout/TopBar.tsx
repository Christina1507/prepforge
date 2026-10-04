import React from 'react';
import { Search, Sun, Moon, Laptop, Compass, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ActiveView } from './Sidebar';

interface TopBarProps {
  activeView: ActiveView;
  onOpenSearch: () => void;
  onOpenWhatToDo: () => void;
  onOpenMobileMenu: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: 'Overview & Readiness',
  today: "Today's Preparation Plan",
  dsa: 'DSA Topic Mastery',
  corecs: 'Core CS Foundations',
  aptitude: 'Aptitude & Reasoning',
  sql: 'SQL & Database Practice',
  roadmaps: 'Placement Learning Roadmaps',
  habits: 'Daily Study Habits',
  mistakes: 'Mistake Book & Lessons',
  revision: 'Spaced Repetition Queue',
  resources: 'Resource Library',
  notes: 'Personal Technical Notes',
  companies: 'Company Placement Pipeline',
  projects: 'Engineering Projects',
  resume: 'Resume Readiness Tracker',
  interviews: 'Technical & HR Mock Prep',
  calendar: 'Placement Event Calendar',
  analytics: 'Preparation Analytics',
  aicoach: 'AI Placement Coach',
  settings: 'Workspace Settings',
};

export function TopBar({ activeView, onOpenSearch, onOpenWhatToDo, onOpenMobileMenu }: TopBarProps) {
  const { theme, cycleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:bg-secondary rounded-md"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-foreground tracking-tight">
            PrepForge
          </span>
          <span className="text-muted-foreground/60 font-light" aria-hidden="true">/</span>
          <span className="text-muted-foreground font-medium truncate">
            {VIEW_TITLES[activeView] || 'Workspace'}
          </span>
        </div>
      </div>

      {/* Zone 2: Global Search Trigger */}
      <div className="hidden sm:flex flex-1 max-w-sm justify-center">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground bg-secondary/80 hover:bg-secondary border border-border rounded-md transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search topics, resources, notes, problems...</span>
          </span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 text-muted-foreground hover:bg-secondary rounded-md"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Intelligent "WHAT SHOULD I DO NOW?" Button */}
        <button
          onClick={onOpenWhatToDo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-secondary hover:bg-muted border border-border rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          title="Calculate your next preparation agenda based on weak topics and due revisions"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>What should I do now?</span>
        </button>

        {/* Compact Theme Toggle - Cycles Light -> Dark -> System -> Light */}
        <button
          onClick={cycleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center justify-center"
          aria-label={`Current theme: ${theme}. Click to cycle: Light -> Dark -> System.`}
          title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (click to cycle)`}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Laptop className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}

