import { create } from 'zustand';
import type { Task, TaskTimeEntry, AppProject, ProjectContext, WeeklyPlan } from '../types';
import { useAuthStore } from './useAuthStore';
import { analyticsService } from '../services/analytics.service';
import {
  getDateRangePreset,
  calculatePlannedVsActual,
  calculateTimeByProject,
  calculateTimeByContext,
  calculateEstimateAccuracy,
  calculateOverplannedDays,
  calculateMostTimeConsumingProjects,
  calculateMostTimeConsumingTasks,
  generateAnalyticsSummary,
} from '../lib/analytics/timeAnalytics';
import { generateInsights } from '../lib/analytics/analyticsInsights';
import type {
  DateRange,
  DatePreset,
  FullAnalyticsData,
  AnalyticsSummary,
  DayTimeData,
  ProjectTimeData,
  ContextTimeData,
  EstimateAccuracyData,
  OverplannedDayData,
  ProjectTimeRanking,
  TaskTimeRanking,
} from '../lib/analytics/timeAnalytics';
import type { AnalyticsInsight } from '../lib/analytics/analyticsInsights';

const DEFAULT_CAPACITY_MINUTES = 300;

interface AnalyticsState {
  dateRange: DateRange;
  tasks: Task[];
  timeEntries: TaskTimeEntry[];
  projects: AppProject[];
  contexts: ProjectContext[];
  weeklyPlans: WeeklyPlan[];
  loading: boolean;
  error: string | null;

  // Computed analytics (derived after fetch)
  analyticsData: FullAnalyticsData | null;
  insights: AnalyticsInsight[];

  setDateRange: (range: DateRange) => Promise<void>;
  setDatePreset: (preset: DatePreset) => Promise<void>;
  fetchAnalyticsData: (range?: DateRange) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

function computeAnalytics(
  tasks: Task[],
  timeEntries: TaskTimeEntry[],
  projects: AppProject[],
  contexts: ProjectContext[],
  weeklyPlans: WeeklyPlan[],
  dateRange: DateRange,
): { analyticsData: FullAnalyticsData; insights: AnalyticsInsight[] } {
  const dailyData: DayTimeData[] = calculatePlannedVsActual(tasks, timeEntries, dateRange);
  const projectTimeData: ProjectTimeData[] = calculateTimeByProject(tasks, timeEntries, projects);
  const contextTimeData: ContextTimeData[] = calculateTimeByContext(tasks, timeEntries, contexts);
  const estimateAccuracy: EstimateAccuracyData = calculateEstimateAccuracy(tasks, timeEntries);
  const overplannedDays: OverplannedDayData[] = calculateOverplannedDays(
    tasks,
    weeklyPlans,
    DEFAULT_CAPACITY_MINUTES,
    dateRange,
  );
  const topProjects: ProjectTimeRanking[] = calculateMostTimeConsumingProjects(
    tasks,
    timeEntries,
    projects,
  );
  const topTasks: TaskTimeRanking[] = calculateMostTimeConsumingTasks(
    tasks,
    timeEntries,
    projects,
    contexts,
  );
  const summary: AnalyticsSummary = generateAnalyticsSummary({
    tasks,
    timeEntries,
    dailyData,
    estimateAccuracy,
    overplannedDays,
    dateRange,
  });

  const analyticsData: FullAnalyticsData = {
    summary,
    dailyData,
    projectTimeData,
    contextTimeData,
    estimateAccuracy,
    overplannedDays,
    topProjects,
    topTasks,
  };

  const insights = generateInsights({
    summary,
    projectTimeData,
    contextTimeData,
    estimateAccuracy,
    overplannedDays,
    topProjects,
    dateRange,
  });

  return { analyticsData, insights };
}

export const useAnalyticsStore = create<AnalyticsState>()((set, get) => ({
  dateRange: getDateRangePreset('last7'),
  tasks: [],
  timeEntries: [],
  projects: [],
  contexts: [],
  weeklyPlans: [],
  loading: false,
  error: null,
  analyticsData: null,
  insights: [],

  setDateRange: async (range: DateRange) => {
    set({ dateRange: range });
    await get().fetchAnalyticsData(range);
  },

  setDatePreset: async (preset: DatePreset) => {
    const range = getDateRangePreset(preset);
    set({ dateRange: range });
    await get().fetchAnalyticsData(range);
  },

  fetchAnalyticsData: async (range?: DateRange) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const effectiveRange = range ?? get().dateRange;
    set({ loading: true, error: null });

    try {
      const [tasks, timeEntries, projects, contexts, weeklyPlans] = await Promise.all([
        analyticsService.fetchTasksInRange(userId, effectiveRange.start, effectiveRange.end),
        analyticsService.fetchTimeEntriesInRange(userId, effectiveRange.start, effectiveRange.end),
        analyticsService.fetchProjects(userId),
        analyticsService.fetchContexts(userId),
        analyticsService.fetchWeeklyPlansInRange(userId, effectiveRange.start, effectiveRange.end),
      ]);

      const { analyticsData, insights } = computeAnalytics(
        tasks,
        timeEntries,
        projects,
        contexts,
        weeklyPlans,
        effectiveRange,
      );

      set({ tasks, timeEntries, projects, contexts, weeklyPlans, analyticsData, insights });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load analytics';
      console.error('Analytics fetch error:', e);
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  refreshAnalytics: async () => {
    await get().fetchAnalyticsData();
  },
}));
