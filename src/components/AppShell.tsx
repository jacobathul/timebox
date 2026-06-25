import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';
import { DailyPlanner } from './DailyPlanner';
import { PlanMyDayFlow } from './PlanMyDayFlow';
import { EndOfDayReview } from './EndOfDayReview';
import { WeeklyView } from './WeeklyView';
import { TaskModal } from './TaskModal';
import { MigrationDialog } from './MigrationDialog';
import { ToastContainer } from './ui/Toast';
import { OfflineBanner } from './ui/OfflineBanner';
import { collectMigratableTasks } from '../services/migration.service';
import { useAuthStore } from '../store/useAuthStore';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { AccountSettingsPage } from '../pages/AccountSettingsPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';

export function AppShell() {
  const { user } = useAuthStore();
  const { fetchRunningTimer } = useTimekeeperStore();
  const [migrationTasks, setMigrationTasks] = useState<ReturnType<typeof collectMigratableTasks>>([]);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRunningTimer();
    }
  }, [user, fetchRunningTimer]);

  useEffect(() => {
    if (user && !migrationChecked) {
      const tasks = collectMigratableTasks();
      setMigrationTasks(tasks);
      setMigrationChecked(true);
    }
  }, [user, migrationChecked]);

  return (
    <>
      <OfflineBanner />

      {/*
        Unified responsive layout:
        - Mobile (<md):  flex column — MobileHeader / content / bottom-nav spacer
        - Desktop (md+): flex row    — Sidebar / content side-by-side
        Single <Routes> renders once; chrome toggles via Tailwind classes.
      */}
      <div className="flex flex-col h-dvh md:flex-row bg-surface-50 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header — hidden on desktop */}
          <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

          {/* Page content — shared by both layouts */}
          <div className="flex-1 flex min-w-0 overflow-hidden">
            <Routes>
              <Route path="today"             element={<DailyPlanner />} />
              <Route path="projects"          element={<ProjectsPage />} />
              <Route path="projects/:id"      element={<ProjectDetailPage />} />
              <Route path="week"              element={<WeeklyView />} />
              <Route path="plan"              element={<PlanMyDayFlow />} />
              <Route path="review"            element={<EndOfDayReview />} />
              <Route path="settings/account"  element={<AccountSettingsPage />} />
              <Route path="settings/contexts" element={<AccountSettingsPage initialTab="contexts" />} />
              <Route path="settings"          element={<Navigate to="account" replace />} />
              <Route path="*"                 element={<Navigate to="today" replace />} />
            </Routes>
          </div>

          {/* Spacer so content isn't hidden under the fixed mobile bottom nav */}
          <div
            className="md:hidden flex-shrink-0"
            style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }}
          />
        </div>
      </div>

      {/* Fixed mobile bottom nav — outside overflow-hidden container */}
      <MobileBottomNav onMoreOpen={() => setDrawerOpen(true)} />

      {/* Slide-out drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <TaskModal />
      <ToastContainer />

      {migrationTasks.length > 0 && (
        <MigrationDialog
          tasks={migrationTasks}
          onDismiss={() => setMigrationTasks([])}
        />
      )}
    </>
  );
}
