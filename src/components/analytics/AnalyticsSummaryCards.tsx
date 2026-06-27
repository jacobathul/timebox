import { formatDuration } from '../../utils/time';
import type { AnalyticsSummary } from '../../lib/analytics/timeAnalytics';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warning?: boolean;
}

function MetricCard({ label, value, sub, accent, warning }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border flex flex-col gap-1 ${
        accent
          ? 'bg-accent-50 border-accent-200'
          : warning
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-stone-200'
      }`}
    >
      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</span>
      <span
        className={`text-xl font-bold ${
          accent ? 'text-accent-700' : warning ? 'text-amber-700' : 'text-stone-800'
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-stone-400">{sub}</span>}
    </div>
  );
}

interface Props {
  summary: AnalyticsSummary;
}

export function AnalyticsSummaryCards({ summary }: Props) {
  const {
    plannedMinutes,
    actualMinutes,
    differenceMinutes,
    estimateAccuracy,
    completedTasks,
    overplannedDays,
  } = summary;

  const diffLabel =
    differenceMinutes === 0
      ? 'On target'
      : differenceMinutes > 0
      ? `+${formatDuration(Math.abs(differenceMinutes))} over`
      : `${formatDuration(Math.abs(differenceMinutes))} under`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label="Planned"
        value={plannedMinutes > 0 ? formatDuration(plannedMinutes) : '—'}
        sub="total estimated"
      />
      <MetricCard
        label="Actual"
        value={actualMinutes > 0 ? formatDuration(actualMinutes) : '—'}
        accent
        sub="tracked time"
      />
      <MetricCard
        label="Difference"
        value={plannedMinutes > 0 || actualMinutes > 0 ? diffLabel : '—'}
        warning={differenceMinutes > 0}
      />
      <MetricCard
        label="Accuracy"
        value={estimateAccuracy > 0 ? `${estimateAccuracy}%` : '—'}
        sub="estimate accuracy"
      />
      <MetricCard
        label="Completed"
        value={String(completedTasks)}
        sub="tasks done"
        accent={completedTasks > 0}
      />
      <MetricCard
        label="Overplanned"
        value={String(overplannedDays)}
        sub="days over capacity"
        warning={overplannedDays > 0}
      />
    </div>
  );
}
