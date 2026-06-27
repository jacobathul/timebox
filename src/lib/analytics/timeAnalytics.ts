import {
  format,
  parseISO,
  eachDayOfInterval,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { Task, TaskTimeEntry, AppProject, ProjectContext, WeeklyPlan } from '../../types';

// ── Types ────────────────────────────────────────────────────

export type DatePreset = 'today' | 'last7' | 'last30' | 'thisWeek' | 'thisMonth';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  preset?: DatePreset;
}

export interface DayTimeData {
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
}

export interface ProjectTimeData {
  projectId: string | null;
  projectName: string;
  projectColor: string | null;
  actualMinutes: number;
  plannedMinutes: number;
  percentage: number;
  taskCount: number;
}

export interface ContextTimeData {
  contextId: string | null;
  contextName: string;
  contextColor: string | null;
  actualMinutes: number;
  percentage: number;
  taskCount: number;
}

export type AccuracyStatus = 'accurate' | 'underestimated' | 'overestimated';

export interface TaskAccuracyData {
  taskId: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  status: AccuracyStatus;
  projectId: string | null;
  contextId: string | null;
  multiplier: number;
}

export interface EstimateAccuracyData {
  averageAccuracy: number;
  underestimatedCount: number;
  overestimatedCount: number;
  accurateCount: number;
  noEstimateCount: number;
  noActualCount: number;
  averageUnderestimateMinutes: number;
  averageOverestimateMinutes: number;
  worstMisses: TaskAccuracyData[];
}

export interface OverplannedDayData {
  date: string;
  plannedMinutes: number;
  capacityMinutes: number;
  overageMinutes: number;
  severity: 'warning' | 'critical';
}

export interface ProjectTimeRanking {
  projectId: string | null;
  projectName: string;
  projectColor: string | null;
  actualMinutes: number;
  plannedMinutes: number;
  completedTasks: number;
  openTasks: number;
  projectStatus: string | null;
}

export interface TaskTimeRanking {
  taskId: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  contextId: string | null;
  contextName: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  status: string;
}

export interface AnalyticsSummary {
  plannedMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  estimateAccuracy: number;
  completedTasks: number;
  tasksWithEstimates: number;
  tasksWithoutEstimates: number;
  overplannedDays: number;
}

export interface FullAnalyticsData {
  summary: AnalyticsSummary;
  dailyData: DayTimeData[];
  projectTimeData: ProjectTimeData[];
  contextTimeData: ContextTimeData[];
  estimateAccuracy: EstimateAccuracyData;
  overplannedDays: OverplannedDayData[];
  topProjects: ProjectTimeRanking[];
  topTasks: TaskTimeRanking[];
}

// ── Helpers ──────────────────────────────────────────────────

function toDateStr(iso: string): string {
  return iso.split('T')[0];
}

function buildTimeEntriesMap(entries: TaskTimeEntry[]): Map<string, TaskTimeEntry[]> {
  const map = new Map<string, TaskTimeEntry[]>();
  for (const entry of entries) {
    if (entry.endedAt === null) continue;
    const list = map.get(entry.taskId) ?? [];
    list.push(entry);
    map.set(entry.taskId, list);
  }
  return map;
}

function getActualMinutesForTask(task: Task, entriesMap: Map<string, TaskTimeEntry[]>): number {
  const entries = entriesMap.get(task.id);
  if (entries && entries.length > 0) {
    return entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  }
  return task.actualMinutes ?? 0;
}

function classifyAccuracy(estimated: number, actual: number): AccuracyStatus {
  if (estimated <= 0 || actual <= 0) return 'accurate';
  const ratio = actual / estimated;
  if (ratio > 1.15) return 'underestimated';
  if (ratio < 0.85) return 'overestimated';
  return 'accurate';
}

// ── Public API ────────────────────────────────────────────────

export function getDateRangePreset(preset: DatePreset): DateRange {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr, preset };
    case 'last7':
      return { start: format(subDays(today, 6), 'yyyy-MM-dd'), end: todayStr, preset };
    case 'last30':
      return { start: format(subDays(today, 29), 'yyyy-MM-dd'), end: todayStr, preset };
    case 'thisWeek':
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        preset,
      };
    case 'thisMonth':
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd'),
        preset,
      };
  }
}

export function groupTimeEntriesByDay(entries: TaskTimeEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.endedAt || !entry.durationMinutes) continue;
    const day = toDateStr(entry.startedAt);
    map.set(day, (map.get(day) ?? 0) + entry.durationMinutes);
  }
  return map;
}

export function calculatePlannedVsActual(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  dateRange: DateRange,
): DayTimeData[] {
  const dates = eachDayOfInterval({
    start: parseISO(dateRange.start),
    end: parseISO(dateRange.end),
  }).map((d) => format(d, 'yyyy-MM-dd'));

  // Planned: sum estimated_minutes by scheduled_date
  const plannedByDay = new Map<string, number>();
  for (const task of tasks) {
    if (!task.scheduledDate || !dates.includes(task.scheduledDate)) continue;
    plannedByDay.set(
      task.scheduledDate,
      (plannedByDay.get(task.scheduledDate) ?? 0) + (task.estimatedMinutes ?? 0),
    );
  }

  // Actual: sum time entries by started_at date
  const actualByDay = new Map<string, number>();
  const tasksWithEntries = new Set<string>();
  for (const entry of timeEntries) {
    if (!entry.endedAt || !entry.durationMinutes) continue;
    const day = toDateStr(entry.startedAt);
    if (dates.includes(day)) {
      actualByDay.set(day, (actualByDay.get(day) ?? 0) + entry.durationMinutes);
      tasksWithEntries.add(entry.taskId);
    }
  }
  // Fallback: tasks with actual_minutes but no time entries — attribute to scheduled_date
  for (const task of tasks) {
    if (tasksWithEntries.has(task.id)) continue;
    if (!task.actualMinutes || !task.scheduledDate) continue;
    if (!dates.includes(task.scheduledDate)) continue;
    actualByDay.set(
      task.scheduledDate,
      (actualByDay.get(task.scheduledDate) ?? 0) + task.actualMinutes,
    );
  }

  return dates.map((date) => {
    const planned = plannedByDay.get(date) ?? 0;
    const actual = actualByDay.get(date) ?? 0;
    return { date, plannedMinutes: planned, actualMinutes: actual, differenceMinutes: actual - planned };
  });
}

export function calculateTimeByProject(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  projects: AppProject[],
): ProjectTimeData[] {
  const entriesMap = buildTimeEntriesMap(timeEntries);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const byProject = new Map<
    string | null,
    { actual: number; planned: number; count: number; project: AppProject | null }
  >();

  for (const task of tasks) {
    const key = task.projectId ?? null;
    const existing = byProject.get(key) ?? {
      actual: 0,
      planned: 0,
      count: 0,
      project: key ? (projectMap.get(key) ?? null) : null,
    };
    existing.actual += getActualMinutesForTask(task, entriesMap);
    existing.planned += task.estimatedMinutes ?? 0;
    existing.count += 1;
    byProject.set(key, existing);
  }

  const totalActual = Array.from(byProject.values()).reduce((s, v) => s + v.actual, 0);

  const result: ProjectTimeData[] = Array.from(byProject.entries()).map(([key, val]) => ({
    projectId: key,
    projectName: val.project?.name ?? 'No Project',
    projectColor: val.project?.color ?? null,
    actualMinutes: val.actual,
    plannedMinutes: val.planned,
    percentage: totalActual > 0 ? Math.round((val.actual / totalActual) * 100) : 0,
    taskCount: val.count,
  }));

  return result.sort((a, b) => b.actualMinutes - a.actualMinutes);
}

export function calculateTimeByContext(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  contexts: ProjectContext[],
): ContextTimeData[] {
  const entriesMap = buildTimeEntriesMap(timeEntries);
  const contextMap = new Map(contexts.map((c) => [c.id, c]));

  const byContext = new Map<
    string | null,
    { actual: number; count: number; context: ProjectContext | null }
  >();

  for (const task of tasks) {
    const key = task.contextId ?? null;
    const existing = byContext.get(key) ?? {
      actual: 0,
      count: 0,
      context: key ? (contextMap.get(key) ?? null) : null,
    };
    existing.actual += getActualMinutesForTask(task, entriesMap);
    existing.count += 1;
    byContext.set(key, existing);
  }

  const totalActual = Array.from(byContext.values()).reduce((s, v) => s + v.actual, 0);

  const result: ContextTimeData[] = Array.from(byContext.entries()).map(([key, val]) => ({
    contextId: key,
    contextName: val.context?.name ?? 'No Context',
    contextColor: val.context?.color ?? null,
    actualMinutes: val.actual,
    percentage: totalActual > 0 ? Math.round((val.actual / totalActual) * 100) : 0,
    taskCount: val.count,
  }));

  return result.sort((a, b) => b.actualMinutes - a.actualMinutes);
}

export function calculateEstimateAccuracy(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
): EstimateAccuracyData {
  const entriesMap = buildTimeEntriesMap(timeEntries);

  const taskData: TaskAccuracyData[] = [];
  let noEstimateCount = 0;
  let noActualCount = 0;

  for (const task of tasks) {
    const estimated = task.estimatedMinutes ?? 0;
    if (estimated <= 0) { noEstimateCount++; continue; }

    const actual = getActualMinutesForTask(task, entriesMap);
    if (actual <= 0) { noActualCount++; continue; }

    const status = classifyAccuracy(estimated, actual);
    const multiplier = Math.round((actual / estimated) * 10) / 10;
    taskData.push({
      taskId: task.id,
      title: task.title,
      estimatedMinutes: estimated,
      actualMinutes: actual,
      differenceMinutes: actual - estimated,
      status,
      projectId: task.projectId,
      contextId: task.contextId,
      multiplier,
    });
  }

  const underestimated = taskData.filter((t) => t.status === 'underestimated');
  const overestimated = taskData.filter((t) => t.status === 'overestimated');
  const accurate = taskData.filter((t) => t.status === 'accurate');

  const accuracyScores = taskData.map((t) =>
    t.estimatedMinutes > 0 && t.actualMinutes > 0
      ? Math.min(t.estimatedMinutes, t.actualMinutes) / Math.max(t.estimatedMinutes, t.actualMinutes)
      : 1,
  );
  const averageAccuracy =
    accuracyScores.length > 0
      ? Math.round((accuracyScores.reduce((s, v) => s + v, 0) / accuracyScores.length) * 100)
      : 0;

  const avgUnder =
    underestimated.length > 0
      ? Math.round(
          underestimated.reduce((s, t) => s + t.differenceMinutes, 0) / underestimated.length,
        )
      : 0;
  const avgOver =
    overestimated.length > 0
      ? Math.round(
          Math.abs(overestimated.reduce((s, t) => s + t.differenceMinutes, 0)) /
            overestimated.length,
        )
      : 0;

  const worstMisses = [...taskData]
    .sort((a, b) => Math.abs(b.differenceMinutes) - Math.abs(a.differenceMinutes))
    .slice(0, 10);

  return {
    averageAccuracy,
    underestimatedCount: underestimated.length,
    overestimatedCount: overestimated.length,
    accurateCount: accurate.length,
    noEstimateCount,
    noActualCount,
    averageUnderestimateMinutes: avgUnder,
    averageOverestimateMinutes: avgOver,
    worstMisses,
  };
}

export function calculateOverplannedDays(
  tasks: Task[],
  weeklyPlans: WeeklyPlan[],
  defaultCapacityMinutes: number,
  dateRange: DateRange,
): OverplannedDayData[] {
  const dates = eachDayOfInterval({
    start: parseISO(dateRange.start),
    end: parseISO(dateRange.end),
  }).map((d) => format(d, 'yyyy-MM-dd'));

  // Build capacity per day from weekly plans
  const capacityByDay = new Map<string, number>();
  for (const plan of weeklyPlans) {
    const weeklyCapacity = plan.weekly_capacity_minutes;
    for (const [date, dayPlan] of Object.entries(plan.day_plans)) {
      if (dayPlan.plannedMinutes && dayPlan.plannedMinutes > 0) {
        // DayPlan.plannedMinutes is what was planned; weekly_capacity / 5 is daily capacity
        // We use weekly_capacity / 5 workdays as the capacity for each day
        if (weeklyCapacity) {
          capacityByDay.set(date, Math.round(weeklyCapacity / 5));
        }
      }
    }
    // If we have weekly capacity but no day-level data, apply to all days in that week
    if (weeklyCapacity && plan.week_start_date) {
      const weekDates = eachDayOfInterval({
        start: parseISO(plan.week_start_date),
        end: parseISO(plan.week_end_date),
      }).map((d) => format(d, 'yyyy-MM-dd'));
      for (const d of weekDates) {
        if (!capacityByDay.has(d)) {
          capacityByDay.set(d, Math.round(weeklyCapacity / 5));
        }
      }
    }
  }

  // Planned minutes per day
  const plannedByDay = new Map<string, number>();
  for (const task of tasks) {
    if (!task.scheduledDate || !dates.includes(task.scheduledDate)) continue;
    plannedByDay.set(
      task.scheduledDate,
      (plannedByDay.get(task.scheduledDate) ?? 0) + (task.estimatedMinutes ?? 0),
    );
  }

  const result: OverplannedDayData[] = [];
  for (const date of dates) {
    const planned = plannedByDay.get(date) ?? 0;
    const capacity = capacityByDay.get(date) ?? defaultCapacityMinutes;
    if (planned > capacity) {
      const ratio = planned / capacity;
      result.push({
        date,
        plannedMinutes: planned,
        capacityMinutes: capacity,
        overageMinutes: planned - capacity,
        severity: ratio > 1.2 ? 'critical' : 'warning',
      });
    }
  }

  return result.sort((a, b) => b.overageMinutes - a.overageMinutes);
}

export function calculateMostTimeConsumingProjects(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  projects: AppProject[],
): ProjectTimeRanking[] {
  const entriesMap = buildTimeEntriesMap(timeEntries);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const byProject = new Map<
    string | null,
    { actual: number; planned: number; completed: number; open: number; project: AppProject | null }
  >();

  for (const task of tasks) {
    const key = task.projectId ?? null;
    const existing = byProject.get(key) ?? {
      actual: 0,
      planned: 0,
      completed: 0,
      open: 0,
      project: key ? (projectMap.get(key) ?? null) : null,
    };
    existing.actual += getActualMinutesForTask(task, entriesMap);
    existing.planned += task.estimatedMinutes ?? 0;
    if (task.status === 'completed') existing.completed += 1;
    else existing.open += 1;
    byProject.set(key, existing);
  }

  return Array.from(byProject.entries())
    .map(([key, val]) => ({
      projectId: key,
      projectName: val.project?.name ?? 'No Project',
      projectColor: val.project?.color ?? null,
      actualMinutes: val.actual,
      plannedMinutes: val.planned,
      completedTasks: val.completed,
      openTasks: val.open,
      projectStatus: val.project?.status ?? null,
    }))
    .sort((a, b) => b.actualMinutes - a.actualMinutes)
    .slice(0, 10);
}

export function calculateMostTimeConsumingTasks(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  projects: AppProject[],
  contexts: ProjectContext[],
): TaskTimeRanking[] {
  const entriesMap = buildTimeEntriesMap(timeEntries);
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const contextMap = new Map(contexts.map((c) => [c.id, c]));

  return tasks
    .map((task) => {
      const actual = getActualMinutesForTask(task, entriesMap);
      return {
        taskId: task.id,
        title: task.title,
        projectId: task.projectId,
        projectName: task.projectId ? (projectMap.get(task.projectId)?.name ?? null) : null,
        contextId: task.contextId,
        contextName: task.contextId ? (contextMap.get(task.contextId)?.name ?? null) : null,
        estimatedMinutes: task.estimatedMinutes ?? 0,
        actualMinutes: actual,
        differenceMinutes: actual - (task.estimatedMinutes ?? 0),
        status: task.status,
      };
    })
    .filter((t) => t.actualMinutes > 0)
    .sort((a, b) => b.actualMinutes - a.actualMinutes)
    .slice(0, 20);
}

export function generateAnalyticsSummary(input: {
  tasks: Task[];
  timeEntries: TaskTimeEntry[];
  dailyData: DayTimeData[];
  estimateAccuracy: EstimateAccuracyData;
  overplannedDays: OverplannedDayData[];
  dateRange: DateRange;
}): AnalyticsSummary {
  const { tasks, timeEntries, dailyData, estimateAccuracy, overplannedDays } = input;
  const entriesMap = buildTimeEntriesMap(timeEntries);

  const plannedMinutes = dailyData.reduce((s, d) => s + d.plannedMinutes, 0);
  const actualMinutes = dailyData.reduce((s, d) => s + d.actualMinutes, 0);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  let tasksWithEstimates = 0;
  let tasksWithoutEstimates = 0;
  for (const task of tasks) {
    if ((task.estimatedMinutes ?? 0) > 0) tasksWithEstimates++;
    else tasksWithoutEstimates++;
  }

  // Re-derive actual from time entries for summary to avoid double counting
  const totalActualFromEntries = Array.from(entriesMap.values()).reduce(
    (s, entries) => s + entries.reduce((es, e) => es + (e.durationMinutes ?? 0), 0),
    0,
  );

  return {
    plannedMinutes,
    actualMinutes: totalActualFromEntries > 0 ? totalActualFromEntries : actualMinutes,
    differenceMinutes:
      (totalActualFromEntries > 0 ? totalActualFromEntries : actualMinutes) - plannedMinutes,
    estimateAccuracy: estimateAccuracy.averageAccuracy,
    completedTasks,
    tasksWithEstimates,
    tasksWithoutEstimates,
    overplannedDays: overplannedDays.length,
  };
}
