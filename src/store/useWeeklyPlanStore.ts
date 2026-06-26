import { create } from 'zustand';
import type { DayPlan, WeeklyPlan, WeeklyPriorityItem } from '../types';
import { useAuthStore } from './useAuthStore';
import { useTaskStore } from './useTaskStore';
import { useToastStore } from './useToastStore';
import { weeklyPlanService, type WeeklyPlanUpsertInput } from '../services/weeklyPlan.service';
import { getWeekEnd } from '../utils/time';

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function toast() {
  return useToastStore.getState();
}

function cloneDayPlan(day: DayPlan): DayPlan {
  return {
    date: day.date,
    focusProjectIds: [...day.focusProjectIds],
    focusTaskIds: [...day.focusTaskIds],
    focusContextIds: [...day.focusContextIds],
    plannedMinutes: day.plannedMinutes,
    notes: day.notes,
  };
}

function normalizePlan(plan: WeeklyPlan): WeeklyPlan {
  const plannedMinutes = Object.values(plan.day_plans ?? {}).reduce((sum, day) => sum + (day.plannedMinutes ?? 0), 0);
  return {
    ...plan,
    selected_project_ids: [...(plan.selected_project_ids ?? [])],
    selected_context_ids: [...(plan.selected_context_ids ?? [])],
    priority_items: [...(plan.priority_items ?? [])],
    day_plans: Object.fromEntries(
      Object.entries(plan.day_plans ?? {}).map(([date, day]) => [date, cloneDayPlan(day)]),
    ),
    planned_minutes: plan.planned_minutes ?? plannedMinutes,
  };
}

function calculateAssignedMinutesForTask(taskId: string): number {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  return task?.estimatedMinutes ?? 0;
}

function removeTaskFromAllDays(dayPlans: Record<string, DayPlan>, taskId: string) {
  const next: Record<string, DayPlan> = {};
  for (const [date, day] of Object.entries(dayPlans)) {
    const focusTaskIds = day.focusTaskIds.filter((id) => id !== taskId);
    const nextDay: DayPlan = {
      ...day,
      focusTaskIds,
      plannedMinutes: Math.max(0, day.plannedMinutes - calculateAssignedMinutesForTask(taskId)),
    };
    next[date] = nextDay;
  }
  return next;
}

function filterRemovedProjectTasks(dayPlans: Record<string, DayPlan>, projectIds: string[]) {
  const tasks = useTaskStore.getState().tasks;
  const next: Record<string, DayPlan> = {};
  for (const [date, day] of Object.entries(dayPlans)) {
    const remainingTaskIds = day.focusTaskIds.filter((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      return !task?.projectId || projectIds.includes(task.projectId);
    });
    const removedMinutes = day.focusTaskIds
      .filter((taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        return !!task?.projectId && !projectIds.includes(task.projectId);
      })
      .reduce((sum, taskId) => sum + calculateAssignedMinutesForTask(taskId), 0);
    next[date] = {
      ...day,
      focusTaskIds: remainingTaskIds,
      focusProjectIds: day.focusProjectIds.filter((projectId) => projectIds.includes(projectId)),
      plannedMinutes: Math.max(0, day.plannedMinutes - removedMinutes),
    };
  }
  return next;
}

interface WeeklyPlanState {
  currentWeeklyPlan: WeeklyPlan | null;
  loading: boolean;
  error: string | null;

  fetchWeeklyPlan: (weekStartDate: string) => Promise<WeeklyPlan | null>;
  createWeeklyPlan: (payload: WeeklyPlanUpsertInput) => Promise<WeeklyPlan>;
  updateWeeklyPlan: (planId: string, updates: Partial<WeeklyPlan> & { weekly_review_reflection?: string | null }) => Promise<WeeklyPlan>;
  upsertWeeklyPlanForWeek: (weekStartDate: string, payload: WeeklyPlanUpsertInput) => Promise<WeeklyPlan>;
  completeWeeklyPlan: (planId: string, reflection: string, completedMinutes?: number | null) => Promise<WeeklyPlan>;
  archiveWeeklyPlan: (planId: string) => Promise<WeeklyPlan>;
  selectProjects: (projectIds: string[]) => Promise<void>;
  updatePriorityItems: (items: WeeklyPriorityItem[]) => Promise<void>;
  updateDayPlan: (date: string, dayPlan: DayPlan) => Promise<void>;
  assignTaskToDay: (taskId: string, date: string) => Promise<void>;
  removeTaskFromDay: (taskId: string, date: string) => Promise<void>;
  calculateWeeklyCapacity: (dayPlans: Record<string, DayPlan>) => number;
  calculatePlannedMinutes: (dayPlans: Record<string, DayPlan>) => number;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>()((set, get) => ({
  currentWeeklyPlan: null,
  loading: false,
  error: null,

  fetchWeeklyPlan: async (weekStartDate) => {
    const uid = getUserId();
    if (!uid) return null;
    set({ loading: true, error: null });
    try {
      const plan = await weeklyPlanService.fetchForWeek(uid, weekStartDate);
      const nextPlan = plan ? normalizePlan(plan) : null;
      set({ currentWeeklyPlan: nextPlan });
      return nextPlan;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load weekly plan';
      set({ error: message });
      toast().addToast('Failed to load weekly plan', 'error');
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createWeeklyPlan: async (payload) => {
    const uid = getUserId();
    if (!uid) throw new Error('User not authenticated');
    set({ loading: true, error: null });
    try {
      const plan = await weeklyPlanService.create(payload, uid);
      const normalized = normalizePlan(plan);
      set({ currentWeeklyPlan: normalized });
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create weekly plan';
      set({ error: message });
      toast().addToast('Failed to create weekly plan', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateWeeklyPlan: async (planId, updates) => {
    const uid = getUserId();
    if (!uid) throw new Error('User not authenticated');
    set({ loading: true, error: null });
    try {
      const plan = await weeklyPlanService.update(planId, updates, uid);
      const normalized = normalizePlan(plan);
      set({ currentWeeklyPlan: normalized });
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update weekly plan';
      set({ error: message });
      toast().addToast('Failed to update weekly plan', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  upsertWeeklyPlanForWeek: async (_weekStartDate, payload) => {
    const uid = getUserId();
    if (!uid) throw new Error('User not authenticated');
    set({ loading: true, error: null });
    try {
      const planInput = payload.week_start_date === _weekStartDate
        ? payload
        : { ...payload, week_start_date: _weekStartDate, week_end_date: getWeekEnd(_weekStartDate) };
      const plan = await weeklyPlanService.upsertForWeek(planInput, uid);
      const normalized = normalizePlan(plan);
      set({ currentWeeklyPlan: normalized });
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save weekly plan';
      set({ error: message });
      toast().addToast('Failed to save weekly plan', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  completeWeeklyPlan: async (planId, reflection, completedMinutes = null) => {
    const uid = getUserId();
    if (!uid) throw new Error('User not authenticated');
    set({ loading: true, error: null });
    try {
      const plan = await weeklyPlanService.complete(planId, uid, {
        completedMinutes,
        reflection,
      });
      const normalized = normalizePlan(plan);
      set({ currentWeeklyPlan: normalized });
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete weekly plan';
      set({ error: message });
      toast().addToast('Failed to complete weekly plan', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  archiveWeeklyPlan: async (planId) => {
    const uid = getUserId();
    if (!uid) throw new Error('User not authenticated');
    try {
      const plan = await weeklyPlanService.archive(planId, uid);
      const normalized = normalizePlan(plan);
      set({ currentWeeklyPlan: normalized });
      return normalized;
    } catch (error) {
      toast().addToast('Failed to archive weekly plan', 'error');
      throw error;
    }
  },

  selectProjects: async (projectIds) => {
    const plan = get().currentWeeklyPlan;
    if (!plan) return;
    const selectedIds = Array.from(new Set(projectIds));
    const nextDayPlans = filterRemovedProjectTasks(plan.day_plans, selectedIds);
    const nextPriorityItems = plan.priority_items.filter((item) => {
      if (item.type === 'project') return !item.projectId || selectedIds.includes(item.projectId);
      if (item.type === 'task') {
        const task = useTaskStore.getState().tasks.find((t) => t.id === item.taskId);
        return !task?.projectId || selectedIds.includes(task.projectId);
      }
      return true;
    });
    await get().updateWeeklyPlan(plan.id, {
      selected_project_ids: selectedIds,
      day_plans: nextDayPlans,
      priority_items: nextPriorityItems,
      planned_minutes: Object.values(nextDayPlans).reduce((sum, day) => sum + day.plannedMinutes, 0),
    });
  },

  updatePriorityItems: async (items) => {
    const plan = get().currentWeeklyPlan;
    if (!plan) return;
    await get().updateWeeklyPlan(plan.id, { priority_items: items });
  },

  updateDayPlan: async (date, dayPlan) => {
    const plan = get().currentWeeklyPlan;
    if (!plan) return;
    const nextDayPlans = { ...plan.day_plans, [date]: dayPlan };
    await get().updateWeeklyPlan(plan.id, {
      day_plans: nextDayPlans,
      planned_minutes: Object.values(nextDayPlans).reduce((sum, day) => sum + day.plannedMinutes, 0),
    });
  },

  assignTaskToDay: async (taskId, date) => {
    const plan = get().currentWeeklyPlan;
    if (!plan) return;
    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextDayPlans = removeTaskFromAllDays(plan.day_plans, taskId);
    const targetDay = nextDayPlans[date] ?? {
      date,
      focusProjectIds: [],
      focusTaskIds: [],
      focusContextIds: [],
      plannedMinutes: 0,
    };

    if (!targetDay.focusTaskIds.includes(taskId)) targetDay.focusTaskIds.push(taskId);
    if (task.projectId && !targetDay.focusProjectIds.includes(task.projectId)) targetDay.focusProjectIds.push(task.projectId);
    if (task.contextId && !targetDay.focusContextIds.includes(task.contextId)) targetDay.focusContextIds.push(task.contextId);
    targetDay.plannedMinutes += task.estimatedMinutes;
    nextDayPlans[date] = targetDay;

    await get().updateWeeklyPlan(plan.id, {
      day_plans: nextDayPlans,
      planned_minutes: Object.values(nextDayPlans).reduce((sum, day) => sum + day.plannedMinutes, 0),
    });
  },

  removeTaskFromDay: async (taskId, date) => {
    const plan = get().currentWeeklyPlan;
    if (!plan) return;
    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    const nextDayPlans = { ...plan.day_plans };
    const day = nextDayPlans[date];
    if (!day) return;
    nextDayPlans[date] = {
      ...day,
      focusTaskIds: day.focusTaskIds.filter((id) => id !== taskId),
      plannedMinutes: Math.max(0, day.plannedMinutes - (task?.estimatedMinutes ?? 0)),
    };
    await get().updateWeeklyPlan(plan.id, {
      day_plans: nextDayPlans,
      planned_minutes: Object.values(nextDayPlans).reduce((sum, item) => sum + item.plannedMinutes, 0),
    });
  },

  calculateWeeklyCapacity: (dayPlans) => Object.values(dayPlans).reduce((sum, day) => sum + (day.plannedMinutes ?? 0), 0),
  calculatePlannedMinutes: (dayPlans) => Object.values(dayPlans).reduce((sum, day) => sum + (day.plannedMinutes ?? 0), 0),
}));
