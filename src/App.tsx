import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';
import { WhatShouldIDoNowModal } from './components/layout/WhatShouldIDoNowModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';

// Feature Views
import { DashboardView } from './components/dashboard/DashboardView';
import { TodayPrepView } from './components/today/TodayPrepView';
import { DSADashboardView } from './components/dsa/DSADashboardView';
import { CoreCSView } from './components/corecs/CoreCSView';
import { AptitudeView } from './components/aptitude/AptitudeView';
import { SQLPracticeView } from './components/sql/SQLPracticeView';
import { RoadmapsView } from './components/roadmaps/RoadmapsView';
import { HabitTrackerView } from './components/habits/HabitTrackerView';
import { MistakeBookView } from './components/mistakes/MistakeBookView';
import { RevisionQueueView } from './components/revision/RevisionQueueView';
import { ResourceLibraryView } from './components/resources/ResourceLibraryView';
import { PersonalNotesView } from './components/notes/PersonalNotesView';
import { CompanyTrackerView } from './components/companies/CompanyTrackerView';
import { ProjectTrackerView } from './components/projects/ProjectTrackerView';
import { ResumeTrackerView } from './components/resume/ResumeTrackerView';
import { InterviewPrepView } from './components/interview/InterviewPrepView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AICoachView } from './components/aicoach/AICoachView';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Modals state
  const [isWhatToDoOpen, setIsWhatToDoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K for search)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto shadow-md animate-pulse">
            P
          </div>
          <div className="text-xs font-semibold tracking-wider text-muted-foreground">
            PrepForge Workspace Initializing...
          </div>
        </div>
      </div>
    );
  }

  const showOnboarding = Boolean(profile && profile.onboarding_completed === 0);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToView={setActiveView}
            onOpenWhatToDo={() => setIsWhatToDoOpen(true)}
          />
        );
      case 'today':
        return (
          <TodayPrepView
            onNavigateToView={setActiveView}
            onOpenWhatToDo={() => setIsWhatToDoOpen(true)}
          />
        );
      case 'dsa':
        return <DSADashboardView />;
      case 'corecs':
        return <CoreCSView />;
      case 'aptitude':
        return <AptitudeView />;
      case 'sql':
        return <SQLPracticeView />;
      case 'roadmaps':
        return <RoadmapsView onNavigateToView={setActiveView} />;
      case 'habits':
        return <HabitTrackerView />;
      case 'mistakes':
        return <MistakeBookView />;
      case 'revision':
        return <RevisionQueueView />;
      case 'resources':
        return <ResourceLibraryView />;
      case 'notes':
        return <PersonalNotesView />;
      case 'companies':
        return <CompanyTrackerView />;
      case 'projects':
        return <ProjectTrackerView />;
      case 'resume':
        return <ResumeTrackerView />;
      case 'interviews':
        return <InterviewPrepView />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'aicoach':
        return <AICoachView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateToView={setActiveView}
            onOpenWhatToDo={() => setIsWhatToDoOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          streakCount={3}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar
          activeView={activeView}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenWhatToDo={() => setIsWhatToDoOpen(true)}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        isDrawerOpen={isMobileDrawerOpen}
        setIsDrawerOpen={setIsMobileDrawerOpen}
      />

      {/* Intelligent "What Should I Do Now?" Modal */}
      <WhatShouldIDoNowModal
        isOpen={isWhatToDoOpen}
        onClose={() => setIsWhatToDoOpen(false)}
        onNavigateToView={(v) => {
          setActiveView(v);
          setIsWhatToDoOpen(false);
        }}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToView={(v) => {
          setActiveView(v);
          setIsSearchOpen(false);
        }}
      />

      {/* Onboarding Flow for New Users */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {}}
      />

      {/* Account Login / Signup Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
