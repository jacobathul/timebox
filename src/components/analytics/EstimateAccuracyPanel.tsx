import type { EstimateAccuracyData } from '../../lib/analytics/timeAnalytics';
import { formatDuration } from '../../utils/time';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: EstimateAccuracyData;
}

function AccuracyBadge({ status }: { status: 'accurate' | 'underestimated' | 'overestimated' }) {
  if (status === 'accurate') return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Accurate</span>
  );
  if (status === 'underestimated') return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Under</span>
  );
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Over</span>
  );
}

export function EstimateAccuracyPanel({ data }: Props) {
  const total = data.accurateCount + data.underestimatedCount + data.overestimatedCount;

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Estimate Accuracy</h3>
        <AnalyticsEmptyState message="No tasks with both estimates and tracked time in this range." />
      </div>
    );
  }

  const accurateW = total > 0 ? Math.round((data.accurateCount / total) * 100) : 0;
  const underW = total > 0 ? Math.round((data.underestimatedCount / total) * 100) : 0;
  const overW = total > 0 ? Math.round((data.overestimatedCount / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Estimate Accuracy</h3>

      {/* Accuracy bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex rounded-full overflow-hidden h-3">
          {accurateW > 0 && <div className="bg-green-400" style={{ width: `${accurateW}%` }} />}
          {underW > 0 && <div className="bg-amber-400" style={{ width: `${underW}%` }} />}
          {overW > 0 && <div className="bg-blue-400" style={{ width: `${overW}%` }} />}
        </div>
        <span className="text-lg font-bold text-stone-800 flex-shrink-0">
          {data.averageAccuracy}%
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{data.accurateCount}</p>
          <p className="text-xs text-stone-500">Accurate</p>
          <p className="text-xs text-stone-400">(±15%)</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">{data.underestimatedCount}</p>
          <p className="text-xs text-stone-500">Under-est.</p>
          {data.averageUnderestimateMinutes > 0 && (
            <p className="text-xs text-stone-400">avg +{formatDuration(data.averageUnderestimateMinutes)}</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{data.overestimatedCount}</p>
          <p className="text-xs text-stone-500">Over-est.</p>
          {data.averageOverestimateMinutes > 0 && (
            <p className="text-xs text-stone-400">avg -{formatDuration(data.averageOverestimateMinutes)}</p>
          )}
        </div>
      </div>

      {data.noEstimateCount > 0 && (
        <p className="text-xs text-stone-400 mb-3">{data.noEstimateCount} task{data.noEstimateCount !== 1 ? 's' : ''} had no estimate and are excluded.</p>
      )}

      {/* Worst misses */}
      {data.worstMisses.length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Largest Estimate Misses</h4>
          <div className="space-y-2">
            {data.worstMisses.slice(0, 5).map((task) => (
              <div key={task.taskId} className="flex items-center gap-2 text-sm">
                <AccuracyBadge status={task.status} />
                <span className="flex-1 text-stone-700 truncate">{task.title}</span>
                <span className="text-stone-400 text-xs flex-shrink-0">
                  {formatDuration(task.estimatedMinutes)} → {formatDuration(task.actualMinutes)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
