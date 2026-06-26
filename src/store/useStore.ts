// UI-only state: view navigation, selected date, and modal control.
// Task/project/review data moved to useTaskStore and useProjectStore.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, AppView } from '../types';
import { todayStr } from '../utils/time';

interface UIState {
  currentView: AppView;
  selectedDate: string;
  activeTaskId: string | null;
  isTaskModalOpen: boolean;
  taskModalInitial: Partial<Task> | null;

  setView: (view: AppView) => void;
  setSelectedDate: (date: string) => void;
  openTaskModal: (initial?: Partial<Task>) => void;
  closeTaskModal: () => void;
  setActiveTask: (id: string | null) => void;
}

export const useStore = create<UIState>()(
  persist(
    (set) => ({
      currentView: 'daily',
      selectedDate: todayStr(),
      activeTaskId: null,
      isTaskModalOpen: false,
      taskModalInitial: null,

      setView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      openTaskModal: (initial) => set({
        isTaskModalOpen: true,
        taskModalInitial: initial ?? null,
        activeTaskId: initial?.id ?? null,
      }),
      closeTaskModal: () => set({ isTaskModalOpen: false, taskModalInitial: null }),
      setActiveTask: (id) => set({ activeTaskId: id }),
    }),
    {
      name: 'timebox-ui',
      partialize: (s) => ({ currentView: s.currentView, selectedDate: s.selectedDate }),
    },
  ),
);
