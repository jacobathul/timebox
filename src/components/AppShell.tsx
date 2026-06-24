import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
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
import { AccountSettingsPage } from '../pages/AccountSettingsPage';

export function AppShell() {
  const { user } = useAuthStore();
  const [migrationTasks, setMigrationTasks] = useState<ReturnType<typeof collectMigratableTasks>>([]);
  const [migrationChecked, setMigrationChecked] = useState(false);

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
      <div className="flex h-screen bg-surface-50 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="today"             element={<DailyPlanner />} />
            <Route path="week"              element={<WeeklyView />} />
            <Route path="plan"              element={<PlanMyDayFlow />} />
            <Route path="review"            element={<EndOfDayReview />} />
            <Route path="settings/account"  element={<AccountSettingsPage />} />
            <Route path="settings"          element={<Navigate to="account" replace />} />
            <Route path="*"                 element={<Navigate to="today" replace />} />
          </Routes>
        </div>

        <TaskModal />
      </div>
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
