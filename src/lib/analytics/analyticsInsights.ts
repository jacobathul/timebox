import { formatDuration } from '../../utils/time';
import type {
  AnalyticsSummary,
  ProjectTimeData,
  ContextTimeData,
  EstimateAccuracyData,
  OverplannedDayData,
  ProjectTimeRanking,
  DateRange,
} from './timeAnalytics';

export interface AnalyticsInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'tip';
}

export function generateInsights(input: {
  summary: AnalyticsSummary;
  projectTimeData: ProjectTimeData[];
  contextTimeData: ContextTimeData[];
  estimateAccuracy: EstimateAccuracyData;
  overplannedDays: OverplannedDayData[];
  topProjects: ProjectTimeRanking[];
  dateRange: DateRange;
}): AnalyticsInsight[] {
  const { summary, estimateAccuracy, overplannedDays, topProjects, dateRange } = input;
  const insights: AnalyticsInsight[] = [];

  const { plannedMinutes, actualMinutes, completedTasks } = summary;
  const { start, end, preset } = dateRange;
  const rangeLabel = getRangeLabel(preset, start, end);

  // Planned vs actual summary
  if (plannedMinutes > 0 && actualMinutes > 0) {
    const diff = Math.abs(actualMinutes - plannedMinutes);
    if (actualMinutes < plannedMinutes) {
      insights.push({
        id: 'planned-vs-actual-under',
        text: `You planned ${formatDuration(plannedMinutes)} but only tracked ${formatDuration(actualMinutes)} ${rangeLabel}.`,
        type: 'info',
      });
    } else if (actualMinutes > plannedMinutes) {
      insights.push({
        id: 'planned-vs-actual-over',
        text: `You tracked ${formatDuration(diff)} more than planned ${rangeLabel}.`,
        type: 'warning',
      });
    } else {
      insights.push({
        id: 'planned-vs-actual-match',
        text: `Your planned and actual time match closely ${rangeLabel}. Great planning!`,
        type: 'success',
      });
    }
  } else if (plannedMinutes > 0 && actualMinutes === 0) {
    insights.push({
      id: 'no-actual-time',
      text: `You planned ${formatDuration(plannedMinutes)} ${rangeLabel} but have no tracked time yet. Start a task timer to track your time.`,
      type: 'tip',
    });
  }

  // Completed tasks
  if (completedTasks > 0) {
    insights.push({
      id: 'completed-tasks',
      text: `You completed ${completedTasks} task${completedTasks !== 1 ? 's' : ''} ${rangeLabel}.`,
      type: 'success',
    });
  }

  // Overplanned days
  if (overplannedDays.length > 0) {
    const critical = overplannedDays.filter((d) => d.severity === 'critical').length;
    if (critical > 0) {
      insights.push({
        id: 'overplanned-critical',
        text: `${critical} day${critical !== 1 ? 's were' : ' was'} critically overplanned (>120% capacity) ${rangeLabel}. Consider spreading tasks over more days.`,
        type: 'warning',
      });
    } else {
      insights.push({
        id: 'overplanned-warning',
        text: `You overplanned ${overplannedDays.length} day${overplannedDays.length !== 1 ? 's' : ''} ${rangeLabel}.`,
        type: 'warning',
      });
    }
  }

  // Estimate accuracy
  const { averageAccuracy, underestimatedCount, overestimatedCount, accurateCount } =
    estimateAccuracy;
  if (underestimatedCount + overestimatedCount + accurateCount > 0) {
    if (averageAccuracy >= 85) {
      insights.push({
        id: 'accuracy-great',
        text: `Your estimate accuracy is ${averageAccuracy}% — excellent planning!`,
        type: 'success',
      });
    } else if (averageAccuracy >= 65) {
      insights.push({
        id: 'accuracy-ok',
        text: `Your estimate accuracy is ${averageAccuracy}%. You underestimated ${underestimatedCount} task${underestimatedCount !== 1 ? 's' : ''} and overestimated ${overestimatedCount}.`,
        type: 'info',
      });
    } else {
      insights.push({
        id: 'accuracy-poor',
        text: `Your estimate accuracy is ${averageAccuracy}%. Consider tracking time more to improve your estimates.`,
        type: 'warning',
      });
    }
  }

  // Underestimation insight
  if (underestimatedCount > 0 && estimateAccuracy.averageUnderestimateMinutes > 0) {
    insights.push({
      id: 'underestimate-avg',
      text: `You underestimated ${underestimatedCount} task${underestimatedCount !== 1 ? 's' : ''} by an average of ${formatDuration(estimateAccuracy.averageUnderestimateMinutes)}.`,
      type: 'tip',
    });
  }

  // Top project
  const topProject = topProjects.find((p) => p.actualMinutes > 0 && p.projectId);
  if (topProject && topProject.actualMinutes > 0) {
    insights.push({
      id: 'top-project',
      text: `Your largest time investment was "${topProject.projectName}" at ${formatDuration(topProject.actualMinutes)}.`,
      type: 'info',
    });
  }

  // Context with worst accuracy
  const worstMiss = estimateAccuracy.worstMisses[0];
  if (worstMiss && worstMiss.multiplier > 1.5) {
    insights.push({
      id: 'worst-miss',
      text: `Your biggest estimate miss was "${worstMiss.title}" — took ${formatDuration(worstMiss.actualMinutes)} vs. ${formatDuration(worstMiss.estimatedMinutes)} estimated.`,
      type: 'tip',
    });
  }

  return insights;
}

function getRangeLabel(preset: DateRange['preset'], start: string, end: string): string {
  switch (preset) {
    case 'today': return 'today';
    case 'last7': return 'in the last 7 days';
    case 'last30': return 'in the last 30 days';
    case 'thisWeek': return 'this week';
    case 'thisMonth': return 'this month';
    default: return `from ${start} to ${end}`;
  }
}
