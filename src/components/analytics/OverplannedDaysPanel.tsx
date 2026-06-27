import { format, parseISO } from 'date-fns';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import type { OverplannedDayData } from '../../lib/analytics/timeAnalytics';
import { formatDuration } from '../../utils/time';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: OverplannedDayData[];
  defaultCapacityMinutes?: number;
}

export function OverplannedDaysPanel({ data, defaultCapacityMinutes = 300 }: Props) {
  const usesDefault = data.some((d) => d.capacityMinutes === defaultCapacityMinutes);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Overplanned Days</h3>
        <AnalyticsEmptyState message="No overplanned days in this range." icon="check" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-1">Overplanned Days</h3>
      {usesDefault && (
        <p className="text-xs text-stone-400 mb-4">
          Using default 5h daily capacity. Set weekly capacity in Weekly Planning to customize.
        </p>
      )}
      <div className="space-y-3">
        {data.map((day) => {
          const label = format(parseISO(day.date), 'EEE, MMM d');
          const ratio = day.plannedMinutes / day.capacityMinutes;
          const barW = Math.min(100, Math.round((day.plannedMinutes / (day.capacityMinutes * 1.5)) * 100));
          return (
            <div key={day.date}>
              <div className="flex items-center gap-2 mb-1">
                {day.severity === 'critical' ? (
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-stone-700">{label}</span>
                <span className={`ml-auto text-xs font-medium ${day.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                  {formatDuration(day.plannedMinutes)} planned · +{formatDuration(day.overageMinutes)} over
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-stone-100 rounded-full h-2 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-stone-300 rounded-full" style={{ width: `${Math.round((day.capacityMinutes / (day.capacityMinutes * 1.5)) * 100)}%` }} />
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${day.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`}
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">{Math.round(ratio * 100)}%</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Capacity: {formatDuration(day.capacityMinutes)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
