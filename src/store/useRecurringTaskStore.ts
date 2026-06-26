import { create } from 'zustand';
import type { RecurringTaskTemplate, Task } from '../types';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import { useTaskStore } from './useTaskStore';
import { recurringTaskService } from '../services/recurring-task.service';
import { buildRecurrenceRule, generateRecurrenceDates, getNextOccurrenceDate, summarizeRecurrenceRule } from '../utils/recurrence';
import { todayStr, dateOffsetStr } from '../utils/time';

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function getTimezone(): string {
  return useAuthStore.getState().profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

function toast() {
  return useToastStore.getState();
}

function asDate(date: string): string {
  return date.slice(0, 10);
}

interface RecurringTemplateInput {
  title: string;
  notes?: string | null;
  estimatedMinutes?: number | null;
  priority?: Task['priority'];
  contextId?: string | null;
  projectId?: string | null;
  recurrenceRule: string;
  startDate: string;
  endDate?: string | null;
  defaultStartTime?: string | null;
  defaultDurationMinutes?: number | null;
  timezone?: string;
  status?: RecurringTaskTemplate['status'];
  archivedAt?: string | null;
}

interface RecurringTaskState {
  templates: RecurringTaskTemplate[];
  loading: boolean;
  error: string | null;

  fetchRecurringTemplates: () => Promise<void>;
  createRecurringTemplate: (payload: RecurringTemplateInput) => Promise<RecurringTaskTemplate | null>;
  updateRecurringTemplate: (templateId: string, payload: Partial<RecurringTemplateInput>) => Promise<void>;
  pauseRecurringTemplate: (templateId: string) => Promise<void>;
  resumeRecurringTemplate: (templateId: string) => Promise<void>;
  archiveRecurringTemplate: (templateId: string) => Promise<void>;
  deleteRecurringTemplate: (templateId: string) => Promise<void>;
  generateInstancesForTemplate: (templateId: string, throughDate: string) => Promise<void>;
  ensureRecurringTasksGeneratedThrough: (date: string) => Promise<void>;
  refreshFutureInstancesForTemplate: (templateId: string, fromDate: string, throughDate: string) => Promise<void>;
  deleteFutureInstancesForTemplate: (templateId: string, fromDate: string) => Promise<void>;
}

export const useRecurringTaskStore = create<RecurringTaskState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  fetchRecurringTemplates: async () => {
    const uid = getUserId();
    if (!uid) return;
    set({ loading: true, error: null });
    try {
      const templates = await recurringTaskService.fetchAll(uid);
      set({ templates });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load recurring tasks';
      set({ error: message });
      toast().addToast(message, 'error');
    } finally {
      set({ loading: false });
    }
  },

  createRecurringTemplate: async (payload) => {
    const uid = getUserId();
    if (!uid) return null;

    const templateInput = {
      userId: uid,
      title: payload.title,
      notes: payload.notes ?? null,
      estimatedMinutes: payload.estimatedMinutes ?? null,
      priority: payload.priority ?? 'medium',
      contextId: payload.contextId ?? null,
      projectId: payload.projectId ?? null,
      recurrenceRule: payload.recurrenceRule,
      recurrenceSummary: summarizeRecurrenceRule({
        recurrenceRule: payload.recurrenceRule,
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
      }),
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      defaultStartTime: payload.defaultStartTime ?? null,
      defaultDurationMinutes: payload.defaultDurationMinutes ?? null,
      timezone: payload.timezone ?? getTimezone(),
      status: payload.status ?? 'active',
    } as const;

    try {
      const saved = await recurringTaskService.create(templateInput);
      set((s) => ({ templates: [saved, ...s.templates] }));
      if (saved.status === 'active') {
        await get().generateInstancesForTemplate(saved.id, dateOffsetStr(60));
      }
      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create recurring template';
      toast().addToast(message, 'error');
      return null;
    }
  },

  updateRecurringTemplate: async (templateId, payload) => {
    const uid = getUserId();
    if (!uid) return;
    const current = get().templates.find((t) => t.id === templateId);
    if (!current) return;

    const merged: Partial<RecurringTaskTemplate> = {
      ...current,
      ...payload,
      recurrenceSummary: payload.recurrenceRule
        ? summarizeRecurrenceRule({
            recurrenceRule: payload.recurrenceRule,
            startDate: payload.startDate ?? current.startDate,
            endDate: payload.endDate ?? current.endDate,
          })
        : payload.endDate !== undefined
          ? summarizeRecurrenceRule({
              recurrenceRule: current.recurrenceRule,
              startDate: payload.startDate ?? current.startDate,
              endDate: payload.endDate,
            })
          : current.recurrenceSummary,
    };

    try {
      await recurringTaskService.update(templateId, merged, uid);
      set((s) => ({
        templates: s.templates.map((t) => (t.id === templateId ? { ...t, ...merged } as RecurringTaskTemplate : t)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recurring template';
      toast().addToast(message, 'error');
    }
  },

  pauseRecurringTemplate: async (templateId) => {
    await get().updateRecurringTemplate(templateId, { status: 'paused' });
  },

  resumeRecurringTemplate: async (templateId) => {
    if (!get().templates.find((t) => t.id === templateId)) return;
    await get().updateRecurringTemplate(templateId, { status: 'active' });
    await get().generateInstancesForTemplate(templateId, dateOffsetStr(60));
  },

  archiveRecurringTemplate: async (templateId) => {
    const now = new Date().toISOString();
    await get().updateRecurringTemplate(templateId, { status: 'archived', archivedAt: now });
  },

  deleteRecurringTemplate: async (templateId) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await recurringTaskService.delete(templateId, uid);
      set((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete recurring template';
      toast().addToast(message, 'error');
    }
  },

  generateInstancesForTemplate: async (templateId, throughDate) => {
    const uid = getUserId();
    if (!uid) return;
    const template = get().templates.find((t) => t.id === templateId) ?? (await recurringTaskService.fetchAll(uid)).find((t) => t.id === templateId);
    if (!template || template.status !== 'active') return;

    const fromDate = todayStr() > template.startDate ? todayStr() : template.startDate;
    const dates = generateRecurrenceDates(template, throughDate, fromDate);
    const existing = new Set(
      useTaskStore.getState().tasks
        .filter((task) => task.recurringTemplateId === templateId && task.recurrenceInstanceDate)
        .map((task) => `${templateId}:${task.recurrenceInstanceDate}`),
    );

    for (const occurrenceDate of dates) {
      if (existing.has(`${templateId}:${occurrenceDate}`)) continue;
      const saved = await useTaskStore.getState().createTaskFromRecurringTemplate(template, occurrenceDate);
      if (saved) existing.add(`${templateId}:${occurrenceDate}`);
    }
  },

  ensureRecurringTasksGeneratedThrough: async (date) => {
    const uid = getUserId();
    if (!uid) return;
    if (get().templates.length === 0) {
      await get().fetchRecurringTemplates();
    }
    const templates = get().templates;
    for (const template of templates) {
      if (template.status !== 'active') continue;
      const windowEnd = template.endDate && template.endDate < date ? template.endDate : date;
      await get().generateInstancesForTemplate(template.id, windowEnd);
    }
  },

  refreshFutureInstancesForTemplate: async (templateId, fromDate, throughDate) => {
    const taskState = useTaskStore.getState();
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const futureTasks = taskState.tasks.filter((task) =>
      task.recurringTemplateId === templateId &&
      task.recurrenceInstanceDate !== null &&
      task.recurrenceInstanceDate >= asDate(fromDate) &&
      task.recurrenceStatus !== 'completed' &&
      task.status !== 'completed'
    );

    for (const task of futureTasks) {
      taskState.deleteTask(task.id);
    }

    const refreshedTemplate = {
      ...template,
      startDate: asDate(fromDate),
    };
    const dates = generateRecurrenceDates(refreshedTemplate, throughDate, asDate(fromDate));
    for (const date of dates) {
      await taskState.createTaskFromRecurringTemplate(refreshedTemplate, date);
    }
  },

  deleteFutureInstancesForTemplate: async (templateId, fromDate) => {
    const taskState = useTaskStore.getState();
    const threshold = asDate(fromDate);
    const futureTasks = taskState.tasks.filter((task) =>
      task.recurringTemplateId === templateId &&
      task.recurrenceInstanceDate !== null &&
      task.recurrenceInstanceDate >= threshold &&
      task.status !== 'completed'
    );
    for (const task of futureTasks) {
      taskState.deleteTask(task.id);
    }
  },
}));

export function buildRecurringTemplateRule(frequency: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom', byDay?: string[], byMonthDay?: number[]): string {
  return buildRecurrenceRule({ frequency, byDay, byMonthDay });
}

export function getRecurringNextOccurrence(template: RecurringTaskTemplate): string | null {
  return getNextOccurrenceDate(template, todayStr());
}
