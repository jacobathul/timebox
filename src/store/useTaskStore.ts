import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, DailyReview, Priority, RecurringTaskTemplate } from '../types';
import { generateId } from '../utils/id';
import { todayStr, dateOffsetStr, addMinutes } from '../utils/time';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { taskService } from '../services/task.service';
import { recurringTaskService } from '../services/recurring-task.service';
import { reviewService } from '../services/review.service';

// ── demo tasks shown to unauthenticated users ──────────────────────────────
function makeDemoTasks(): Task[] {
  const now = new Date().toISOString();
  const today = todayStr();
  const make = (
    id: string, title: string, mins: number, priority: Priority,
    contextId: string | null, notes = '', startTime?: string,
  ): Task => ({
    id, title, notes, estimatedMinutes: mins, actualMinutes: null,
    priority, status: startTime ? 'scheduled' : 'inbox',
    contextId, projectId: null, scheduledDate: startTime ? today : null,
    startTime: startTime ?? null, endTime: startTime ? addMinutes(startTime, mins) : null,
    completedAt: null, recurringTemplateId: null, recurrenceInstanceDate: null, recurrenceStatus: null,
    createdAt: now, updatedAt: now,
    sourceProvider: null, sourceType: null, sourceExternalId: null,
    sourceUrl: null, sourceTitle: null, sourceMetadata: null,
  });
  return [
    make('demo-1', 'Review pull request', 45, 'high', 'ctx-work', 'Review the auth refactor PR', '09:00'),
    make('demo-2', 'Study machine learning', 90, 'medium', 'ctx-personal', 'Chapter 4: Neural Networks', '10:00'),
    make('demo-3', 'Workout', 60, 'medium', 'ctx-personal', 'Upper body + cardio', '07:00'),
    make('demo-4', 'Grocery shopping', 30, 'low', 'ctx-personal'),
    make('demo-5', 'Reply to emails', 30, 'medium', 'ctx-work', 'Clear inbox from last 2 days'),
  ];
}

// ── helpers ────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
function toast() {
  return useToastStore.getState();
}

function buildTask(partial: Partial<Task>): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: partial.title ?? 'Untitled task',
    notes: partial.notes ?? '',
    estimatedMinutes: partial.estimatedMinutes ?? 30,
    actualMinutes: null,
    priority: partial.priority ?? 'medium',
    status: partial.status ?? 'inbox',
    contextId: partial.contextId ?? null,
    projectId: partial.projectId ?? null,
    scheduledDate: partial.scheduledDate ?? null,
    startTime: partial.startTime ?? null,
    endTime: partial.endTime ?? null,
    completedAt: null,
    recurringTemplateId: partial.recurringTemplateId ?? null,
    recurrenceInstanceDate: partial.recurrenceInstanceDate ?? null,
    recurrenceStatus: partial.recurrenceStatus ?? null,
    createdAt: now,
    updatedAt: now,
    sourceProvider: partial.sourceProvider ?? null,
    sourceType: partial.sourceType ?? null,
    sourceExternalId: partial.sourceExternalId ?? null,
    sourceUrl: partial.sourceUrl ?? null,
    sourceTitle: partial.sourceTitle ?? null,
    sourceMetadata: partial.sourceMetadata ?? null,
  };
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

  // Context menu actions
  addTaskToToday: (id: string) => void;
  moveTaskToDate: (id: string, date: string) => void;
  moveTaskToInbox: (id: string) => void;
  duplicateTask: (id: string) => void;
  createTaskFromRecurringTemplate: (template: RecurringTaskTemplate, occurrenceDate: string) => Promise<Task | null>;
  updateRecurringTaskInstance: (
    taskId: string,
    scope: { scope: 'instance' | 'series'; updates: Partial<Task>; templateUpdates?: Partial<RecurringTaskTemplate> },
  ) => Promise<void>;
  deleteRecurringTaskInstance: (taskId: string, scope: { scope: 'instance' | 'series' }) => Promise<void>;
  completeRecurringTaskInstance: (taskId: string) => void;

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
        } catch {
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
        const task = buildTask(partial);
        set((s) => ({ tasks: [...s.tasks, task] }));

        const uid = getUserId();
        if (uid) {
          taskService.create(task, uid).then((saved) => {
            // Replace temporary local ID with the server-assigned UUID
            set((s) => ({
              tasks: s.tasks.map((t) => t.id === task.id ? saved : t),
            }));
          }).catch(() => {
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

      addTaskToToday: (id) => {
        get().updateTask(id, {
          status: 'scheduled',
          scheduledDate: todayStr(),
          startTime: null,
          endTime: null,
        });
      },

      moveTaskToDate: (id, date) => {
        get().updateTask(id, {
          status: 'scheduled',
          scheduledDate: date,
          startTime: null,
          endTime: null,
        });
      },

      moveTaskToInbox: (id) => {
        get().updateTask(id, {
          status: 'inbox',
          scheduledDate: null,
          startTime: null,
          endTime: null,
          completedAt: null,
        });
      },

      duplicateTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        get().addTask({
          title: task.title,
          notes: task.notes,
          estimatedMinutes: task.estimatedMinutes,
          priority: task.priority,
          contextId: task.contextId,
          projectId: task.projectId,
          status: 'inbox',
          scheduledDate: null,
          startTime: null,
          endTime: null,
        });
      },

      createTaskFromRecurringTemplate: async (template, occurrenceDate) => {
        const now = new Date().toISOString();
        const task: Task = {
          ...buildTask({
            title: template.title,
            notes: template.notes ?? '',
            estimatedMinutes: template.estimatedMinutes ?? template.defaultDurationMinutes ?? 30,
            priority: template.priority,
            contextId: template.contextId,
            projectId: template.projectId,
            status: template.defaultStartTime ? 'scheduled' : 'inbox',
            scheduledDate: occurrenceDate,
            startTime: template.defaultStartTime,
            endTime: template.defaultStartTime && template.defaultDurationMinutes
              ? addMinutes(template.defaultStartTime, template.defaultDurationMinutes)
              : null,
            recurringTemplateId: template.id,
            recurrenceInstanceDate: occurrenceDate,
            recurrenceStatus: 'generated',
          }),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        const uid = getUserId();
        if (uid) {
          try {
            const saved = await taskService.create(task, uid);
            set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? saved : t)) }));
            return saved;
          } catch {
            set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
            toast().addToast('Failed to save recurring task', 'error');
          }
        }
        return task;
      },

      updateRecurringTaskInstance: async (taskId, scope) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const moved = ['scheduledDate', 'startTime', 'endTime'].some((key) => scope.updates[key as keyof Task] !== undefined);
        const nextUpdates: Partial<Task> = {
          ...scope.updates,
          recurrenceStatus: task.recurringTemplateId && moved ? 'moved' : scope.updates.recurrenceStatus,
        };

        if (scope.scope === 'instance' || !task.recurringTemplateId) {
          get().updateTask(taskId, nextUpdates);
          return;
        }

        get().updateTask(taskId, nextUpdates);
        const uid = getUserId();
        if (!uid) return;
        const templateId = task.recurringTemplateId;
        const templateUpdates = scope.templateUpdates ?? {
          title: scope.updates.title,
          notes: scope.updates.notes,
          estimatedMinutes: scope.updates.estimatedMinutes,
          priority: scope.updates.priority,
          contextId: scope.updates.contextId,
          projectId: scope.updates.projectId,
        };
        await recurringTaskService.update(templateId, templateUpdates, uid);
      },

      deleteRecurringTaskInstance: async (taskId, scope) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        if (scope.scope === 'instance' || !task.recurringTemplateId) {
          get().deleteTask(taskId);
          return;
        }
        const uid = getUserId();
        if (!uid) return;
        const templateId = task.recurringTemplateId;
        await recurringTaskService.update(templateId, { status: 'archived', archivedAt: new Date().toISOString() }, uid);
        await get().fetchTasks();
      },

      completeRecurringTaskInstance: (taskId) => {
        get().completeTask(taskId);
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
      name: 'timebox-tasks',
      partialize: (s) => ({ tasks: s.tasks, reviews: s.reviews }),
    },
  ),
);
