import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTaskStore } from './useTaskStore';
import { useProjectStore } from './useProjectStore';
import { useSettingsStore } from './useSettingsStore';
import { useGoogleIntegrationStore } from './useGoogleIntegrationStore';
import { getPlanningWarnings } from '../lib/planning/warningEngine';
import type { PlanningWarning } from '../types';

interface PlanningWarningsState {
  warnings: PlanningWarning[];
  loading: boolean;
  dismissedWarningIds: string[];

  getWarningsForDate: (date: string) => PlanningWarning[];
  getWarningsForTask: (taskId: string) => PlanningWarning[];
  getWarningsForProject: (projectId: string) => PlanningWarning[];
  recalculateWarnings: () => void;
  dismissWarning: (warningId: string) => void;
}

export const usePlanningWarningsStore = create<PlanningWarningsState>()(
  persist(
    (set, get) => ({
      warnings: [],
      loading: false,
      dismissedWarningIds: [],

      getWarningsForDate: (date) => {
        const dismissed = new Set(get().dismissedWarningIds);
        return get().warnings.filter((w) => w.date === date && !dismissed.has(w.id));
      },

      getWarningsForTask: (taskId) => {
        const dismissed = new Set(get().dismissedWarningIds);
        return get().warnings.filter(
          (w) => (w.taskId === taskId || w.relatedEntityIds?.includes(taskId)) && !dismissed.has(w.id),
        );
      },

      getWarningsForProject: (projectId) => {
        const dismissed = new Set(get().dismissedWarningIds);
        return get().warnings.filter((w) => w.projectId === projectId && !dismissed.has(w.id));
      },

      recalculateWarnings: () => {
        set({ loading: true });
        const tasks = useTaskStore.getState().tasks;
        const projects = useProjectStore.getState().projects;
        const settings = useSettingsStore.getState().settings;
        const calendarEvents = useGoogleIntegrationStore.getState().calendarEvents;

        const warnings = getPlanningWarnings({ tasks, projects, calendarEvents, settings });
        set({ warnings, loading: false });
      },

      dismissWarning: (warningId) => {
        set((state) => ({
          dismissedWarningIds: [...new Set([...state.dismissedWarningIds, warningId])],
        }));
      },
    }),
    {
      name: 'timebox-dismissed-warnings',
      partialize: (state) => ({ dismissedWarningIds: state.dismissedWarningIds }),
    },
  ),
);
