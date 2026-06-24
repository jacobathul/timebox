import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, DailyReview, Priority } from '../types';
import { generateId } from '../utils/id';
import { todayStr, dateOffsetStr, addMinutes } from '../utils/time';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { taskService } from '../services/task.service';
import { reviewService } from '../services/review.service';

// ── demo tasks shown to unauthenticated users ──────────────────────────────
function makeDemoTasks(): Task[] {
  const now = new Date().toISOString();
  const today = todayStr();
  const make = (
    id: string, title: string, mins: number, priority: Priority,
    projectId: string | null, notes = '', startTime?: string,
  ): Task => ({
    id, title, notes, estimatedMinutes: mins, actualMinutes: null,
    priority, status: startTime ? 'scheduled' : 'inbox',
    projectId, scheduledDate: startTime ? today : null,
    startTime: startTime ?? null, endTime: startTime ? addMinutes(startTime, mins) : null,
    completedAt: null, createdAt: now, updatedAt: now,
  });
  return [
    make('demo-1', 'Review pull request', 45, 'high', 'proj-work', 'Review the auth refactor PR', '09:00'),
    make('demo-2', 'Study machine learning', 90, 'medium', 'proj-learning', 'Chapter 4: Neural Networks', '10:00'),
    make('demo-3', 'Workout', 60, 'medium', 'proj-personal', 'Upper body + cardio', '07:00'),
    make('demo-4', 'Grocery shopping', 30, 'low', 'proj-personal'),
    make('demo-5', 'Reply to emails', 30, 'medium', 'proj-work', 'Clear inbox from last 2 days'),
  ];
}

// ── helpers ────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
function toast() {
  return useToastStore.getState();
}

interface TaskState {
  tasks: Task[];
  reviews: DailyReview[];
  loading: boolean;

  // Cloud sync
  fetchTasks: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  clearData: () => void;

  // Task CRUD (optimistic, syncs to Supabase when logged in)
  addTask: (partial: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  scheduleTask: (id: string, date: string, startTime: string, durationMinutes: number) => void;
  unscheduleTask: (id: string) => void;
  moveTask: (id: string, newStartTime: string) => void;
  resizeTask: (id: string, newEndTime: string) => void;
  rollTaskToTomorrow: (id: string) => void;

  // Reviews
  saveReview: (review: DailyReview) => void;
  getReview: (date: string) => DailyReview | undefined;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: makeDemoTasks(),
      reviews: [],
      loading: false,

      // ── cloud fetch ──────────────────────────────────────────────────────

      fetchTasks: async () => {
        const uid = getUserId();
        if (!uid) return;
        set({ loading: true });
        try {
          const tasks = await taskService.fetchAll(uid);
          set({ tasks });
        } catch (e) {
          toast().addToast('Failed to load tasks. Retrying…', 'error');
        } finally {
          set({ loading: false });
        }
      },

      fetchReviews: async () => {
        const uid = getUserId();
        if (!uid) return;
        try {
          const reviews = await reviewService.fetchAll(uid);
          set({ reviews });
        } catch { /* silent */ }
      },

      clearData: () => set({ tasks: [], reviews: [] }),

      // ── task actions (optimistic) ────────────────────────────────────────

      addTask: (partial) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: generateId(),
          title: partial.title ?? 'Untitled task',
          notes: partial.notes ?? '',
          estimatedMinutes: partial.estimatedMinutes ?? 30,
          actualMinutes: null,
          priority: partial.priority ?? 'medium',
          status: partial.status ?? 'inbox',
          projectId: partial.projectId ?? null,
          scheduledDate: partial.scheduledDate ?? null,
          startTime: partial.startTime ?? null,
          endTime: partial.endTime ?? null,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));

        const uid = getUserId();
        if (uid) {
          taskService.create(task, uid).catch(() => {
            set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
            toast().addToast('Failed to save task', 'error');
          });
        }
        return task;
      },

      updateTask: (id, updates) => {
        const prev = get().tasks.find((t) => t.id === id);
        const now = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates, updatedAt: now } : t),
        }));
        const uid = getUserId();
        if (uid) {
          taskService.update(id, { ...updates, updatedAt: now }, uid).catch(() => {
            if (prev) set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? prev : t) }));
            toast().addToast('Failed to update task', 'error');
          });
        }
      },

      deleteTask: (id) => {
        const prev = get().tasks.find((t) => t.id === id);
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        const uid = getUserId();
        if (uid) {
          taskService.delete(id, uid).catch(() => {
            if (prev) set((s) => ({ tasks: [...s.tasks, prev] }));
            toast().addToast('Failed to delete task', 'error');
          });
        }
      },

      completeTask: (id) => {
        get().updateTask(id, { status: 'completed', completedAt: new Date().toISOString() });
      },

      uncompleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        get().updateTask(id, {
          status: task?.scheduledDate ? 'scheduled' : 'inbox',
          completedAt: null,
        });
      },

      scheduleTask: (id, date, startTime, durationMinutes) => {
        get().updateTask(id, {
          status: 'scheduled',
          scheduledDate: date,
          startTime,
          endTime: addMinutes(startTime, durationMinutes),
        });
      },

      unscheduleTask: (id) => {
        get().updateTask(id, {
          status: 'inbox',
          scheduledDate: null,
          startTime: null,
          endTime: null,
        });
      },

      moveTask: (id, newStartTime) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        get().updateTask(id, {
          startTime: newStartTime,
          endTime: addMinutes(newStartTime, task.estimatedMinutes),
        });
      },

      resizeTask: (id, newEndTime) => {
        get().updateTask(id, { endTime: newEndTime });
      },

      rollTaskToTomorrow: (id) => {
        get().updateTask(id, {
          status: 'inbox',
          scheduledDate: dateOffsetStr(1),
          startTime: null,
          endTime: null,
        });
      },

      // ── reviews ─────────────────────────────────────────────────────────

      saveReview: (review) => {
        set((s) => {
          const idx = s.reviews.findIndex((r) => r.date === review.date);
          const next = idx >= 0
            ? s.reviews.map((r, i) => (i === idx ? review : r))
            : [...s.reviews, review];
          return { reviews: next };
        });
        const uid = getUserId();
        if (uid) {
          reviewService.save(review, uid).catch(() => {
            toast().addToast('Failed to save review', 'error');
          });
        }
      },

      getReview: (date) => get().reviews.find((r) => r.date === date),
    }),
    {
      name: 'flowday-tasks',
      partialize: (s) => ({ tasks: s.tasks, reviews: s.reviews }),
    },
  ),
);
