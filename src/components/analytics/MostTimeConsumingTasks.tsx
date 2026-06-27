import type { TaskTimeRanking } from '../../lib/analytics/timeAnalytics';
import { formatDuration } from '../../utils/time';
import { useStore } from '../../store/useStore';
import { useTaskStore } from '../../store/useTaskStore';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: TaskTimeRanking[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Done</span>;
  if (status === 'scheduled')
    return <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-accent-100 text-accent-700">Scheduled</span>;
  return <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-500">Inbox</span>;
}

export function MostTimeConsumingTasks({ data }: Props) {
  const { openTaskModal } = useStore();
  const { tasks } = useTaskStore();

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Most Time-Consuming Tasks</h3>
        <AnalyticsEmptyState message="No task time tracked in this range." />
      </div>
    );
  }

  function handleTaskClick(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) openTaskModal(task);
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Most Time-Consuming Tasks</h3>
      <div className="space-y-1">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1.5rem_1fr_auto_auto_auto_auto] gap-2 text-xs font-medium text-stone-400 uppercase tracking-wide pb-1 border-b border-stone-100">
          <span>#</span>
          <span>Task</span>
          <span>Status</span>
          <span>Est.</span>
          <span>Actual</span>
          <span>Diff</span>
        </div>
        {data.slice(0, 15).map((task, i) => (
          <button
            key={task.taskId}
            onClick={() => handleTaskClick(task.taskId)}
            className="w-full text-left hover:bg-stone-50 rounded-lg transition-colors group"
          >
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[1.5rem_1fr_auto_auto_auto_auto] gap-2 items-center py-2 px-1">
              <span className="text-xs text-stone-400">#{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm text-stone-700 truncate group-hover:text-accent-600">{task.title}</p>
                {(task.projectName || task.contextName) && (
                  <p className="text-xs text-stone-400 truncate">
                    {[task.projectName, task.contextName].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <StatusBadge status={task.status} />
              <span className="text-xs text-stone-500 text-right">{task.estimatedMinutes > 0 ? formatDuration(task.estimatedMinutes) : '—'}</span>
              <span className="text-xs font-medium text-stone-700 text-right">{formatDuration(task.actualMinutes)}</span>
              <span className={`text-xs text-right ${task.differenceMinutes > 0 ? 'text-amber-600' : task.differenceMinutes < 0 ? 'text-stone-400' : 'text-green-600'}`}>
                {task.differenceMinutes === 0 ? '—' : task.differenceMinutes > 0 ? `+${formatDuration(task.differenceMinutes)}` : `-${formatDuration(Math.abs(task.differenceMinutes))}`}
              </span>
            </div>

            {/* Mobile card */}
            <div className="sm:hidden py-2 px-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-stone-400">#{i + 1}</span>
                <span className="text-sm text-stone-700 truncate flex-1">{task.title}</span>
                <span className="text-sm font-semibold text-stone-700">{formatDuration(task.actualMinutes)}</span>
              </div>
              {(task.projectName || task.contextName) && (
                <p className="text-xs text-stone-400 truncate pl-5">
                  {[task.projectName, task.contextName].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
