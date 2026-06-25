import { create } from 'zustand';
import type { TaskTimeEntry } from '../types';
import { useAuthStore } from './useAuthStore';
import { useTaskStore } from './useTaskStore';
import { useToastStore } from './useToastStore';
import { timekeeperService } from '../services/timekeeper.service';

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
function toast() {
  return useToastStore.getState();
}

interface TimekeeperState {
  runningEntry: TaskTimeEntry | null;
  entries: Record<string, TaskTimeEntry[]>; // keyed by taskId
  loading: boolean;

  fetchRunningTimer: () => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  stopRunningTimer: () => Promise<void>;
  fetchTimeEntriesForTask: (taskId: string) => Promise<void>;
  fetchTimeEntriesForDate: (date: string) => Promise<TaskTimeEntry[]>;
  createManualTimeEntry: (
    taskId: string,
    payload: { startedAt: string; endedAt: string; durationMinutes: number; notes?: string },
  ) => Promise<void>;
  updateTimeEntry: (
    entryId: string,
    taskId: string,
    updates: Partial<{ startedAt: string; endedAt: string; durationMinutes: number; notes: string }>,
  ) => Promise<void>;
  deleteTimeEntry: (entryId: string, taskId: string) => Promise<void>;
  recalculateTaskActualMinutes: (taskId: string) => Promise<void>;
}

export const useTimekeeperStore = create<TimekeeperState>()((set, get) => ({
  runningEntry: null,
  entries: {},
  loading: false,

  fetchRunningTimer: async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const entry = await timekeeperService.fetchRunningEntry(uid);
      set({ runningEntry: entry ?? null });
    } catch (e) {
      console.error('Failed to fetch running timer', e);
    }
  },

  startTimer: async (taskId: string) => {
    const uid = getUserId();
    if (!uid) return;
    set({ loading: true });
    try {
      const { runningEntry } = get();
      if (runningEntry) {
        await timekeeperService.stopTimer(runningEntry.id, uid);
        await get().recalculateTaskActualMinutes(runningEntry.taskId);
        await get().fetchTimeEntriesForTask(runningEntry.taskId);
      }
      const entry = await timekeeperService.startTimer(taskId, uid);
      set({ runningEntry: entry });
      toast().addToast('Timer started.', 'success');
    } catch (e) {
      console.error('Failed to start timer', e);
      toast().addToast('Failed to start timer', 'error');
    } finally {
      set({ loading: false });
    }
  },

  stopRunningTimer: async () => {
    const uid = getUserId();
    if (!uid) return;
    const { runningEntry } = get();
    if (!runningEntry) return;
    set({ loading: true });
    try {
      await timekeeperService.stopTimer(runningEntry.id, uid);
      const taskId = runningEntry.taskId;
      set({ runningEntry: null });
      await get().recalculateTaskActualMinutes(taskId);
      await get().fetchTimeEntriesForTask(taskId);
      toast().addToast('Time logged.', 'success');
    } catch (e) {
      console.error('Failed to stop timer', e);
      toast().addToast('Failed to stop timer', 'error');
    } finally {
      set({ loading: false });
    }
  },

  fetchTimeEntriesForTask: async (taskId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const entries = await timekeeperService.fetchForTask(taskId, uid);
      set((s) => ({ entries: { ...s.entries, [taskId]: entries } }));
    } catch (e) {
      console.error('Failed to fetch time entries', e);
    }
  },

  fetchTimeEntriesForDate: async (date: string) => {
    const uid = getUserId();
    if (!uid) return [];
    try {
      return await timekeeperService.fetchForDate(date, uid);
    } catch (e) {
      console.error('Failed to fetch time entries for date', e);
      return [];
    }
  },

  createManualTimeEntry: async (taskId, payload) => {
    const uid = getUserId();
    if (!uid) return;
    set({ loading: true });
    try {
      const entry = await timekeeperService.createManualEntry(taskId, uid, payload);
      set((s) => ({
        entries: {
          ...s.entries,
          [taskId]: [entry, ...(s.entries[taskId] ?? [])],
        },
      }));
      await get().recalculateTaskActualMinutes(taskId);
      toast().addToast('Time logged.', 'success');
    } catch (e) {
      console.error('Failed to log time', e);
      toast().addToast('Failed to log time', 'error');
    } finally {
      set({ loading: false });
    }
  },

  updateTimeEntry: async (entryId, taskId, updates) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const updated = await timekeeperService.updateEntry(entryId, uid, updates);
      set((s) => ({
        entries: {
          ...s.entries,
          [taskId]: (s.entries[taskId] ?? []).map((e) => (e.id === entryId ? updated : e)),
        },
      }));
      await get().recalculateTaskActualMinutes(taskId);
      toast().addToast('Entry updated.', 'success');
    } catch (e) {
      console.error('Failed to update entry', e);
      toast().addToast('Failed to update entry', 'error');
    }
  },

  deleteTimeEntry: async (entryId, taskId) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await timekeeperService.deleteEntry(entryId, uid);
      set((s) => ({
        entries: {
          ...s.entries,
          [taskId]: (s.entries[taskId] ?? []).filter((e) => e.id !== entryId),
        },
      }));
      await get().recalculateTaskActualMinutes(taskId);
      toast().addToast('Entry deleted.', 'success');
    } catch (e) {
      console.error('Failed to delete entry', e);
      toast().addToast('Failed to delete entry', 'error');
    }
  },

  recalculateTaskActualMinutes: async (taskId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const total = await timekeeperService.calculateActualMinutes(taskId, uid);
      useTaskStore.getState().updateTask(taskId, { actualMinutes: total });
    } catch (e) {
      console.error('Failed to recalculate actual minutes', e);
    }
  },
}));
