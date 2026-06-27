import { useEffect } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import type { DatePreset } from '../lib/analytics/timeAnalytics';
import { AnalyticsDateRangePicker } from '../components/analytics/AnalyticsDateRangePicker';
import { AnalyticsSummaryCards } from '../components/analytics/AnalyticsSummaryCards';
import { PlannedVsActualChart } from '../components/analytics/PlannedVsActualChart';
import { TimeByProjectChart } from '../components/analytics/TimeByProjectChart';
import { TimeByContextChart } from '../components/analytics/TimeByContextChart';
import { EstimateAccuracyPanel } from '../components/analytics/EstimateAccuracyPanel';
import { OverplannedDaysPanel } from '../components/analytics/OverplannedDaysPanel';
import { MostTimeConsumingProjects } from '../components/analytics/MostTimeConsumingProjects';
import { MostTimeConsumingTasks } from '../components/analytics/MostTimeConsumingTasks';
import { AnalyticsInsightCard } from '../components/analytics/AnalyticsInsightCard';
import { AnalyticsEmptyState } from '../components/analytics/AnalyticsEmptyState';

export function AnalyticsPage() {
  const {
    dateRange,
    loading,
    error,
    analyticsData,
    insights,
    setDatePreset,
    setDateRange,
    fetchAnalyticsData,
    refreshAnalytics,
  } = useAnalyticsStore();

  useEffect(() => {
    void fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePreset(preset: DatePreset) {
    void setDatePreset(preset);
  }

  function handleCustomRange(start: string, end: string) {
    if (start && end && start <= end) {
      void setDateRange({ start, end });
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-stone-50">
      <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={22} className="text-accent-500" />
            <h1 className="text-xl font-bold text-stone-800">Analytics</h1>
          </div>
          <button
            onClick={() => void refreshAnalytics()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-200 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Date range picker */}
        <AnalyticsDateRangePicker
          dateRange={dateRange}
          onPresetSelect={handlePreset}
          onCustomRange={handleCustomRange}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !analyticsData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-stone-200 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-56 bg-stone-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-56 bg-stone-200 rounded-xl animate-pulse" />
              <div className="h-56 bg-stone-200 rounded-xl animate-pulse" />
            </div>
          </div>
        )}

        {/* Empty state (no data at all) */}
        {!loading && !analyticsData && !error && (
          <div className="bg-white rounded-xl border border-stone-200 p-10">
            <AnalyticsEmptyState message="No tracked time yet. Start a task timer to see analytics." icon="timer" />
          </div>
        )}

        {/* Main content */}
        {analyticsData && (
          <>
            {/* Summary cards */}
            <AnalyticsSummaryCards summary={analyticsData.summary} />

            {/* Insights */}
            {insights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights.map((insight) => (
                  <AnalyticsInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}

            {/* Planned vs Actual */}
            <PlannedVsActualChart data={analyticsData.dailyData} />

            {/* Time by Project and Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimeByProjectChart data={analyticsData.projectTimeData} />
              <TimeByContextChart data={analyticsData.contextTimeData} />
            </div>

            {/* Estimate Accuracy and Overplanned Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EstimateAccuracyPanel data={analyticsData.estimateAccuracy} />
              <OverplannedDaysPanel data={analyticsData.overplannedDays} />
            </div>

            {/* Most time-consuming projects */}
            <MostTimeConsumingProjects data={analyticsData.topProjects} />

            {/* Most time-consuming tasks */}
            <MostTimeConsumingTasks data={analyticsData.topTasks} />
          </>
        )}
      </div>
    </div>
  );
}
