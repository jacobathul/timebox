import { useEffect, useState } from 'react';
import { Timer, Square } from 'lucide-react';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { useTaskStore } from '../store/useTaskStore';
import { useStore } from '../store/useStore';
import { formatElapsed } from '../utils/time';

export function RunningTimerBadge() {
  const { runningEntry, stopRunningTimer } = useTimekeeperStore();
  const { tasks } = useTaskStore();
  const { openTaskModal } = useStore();
  const [elapsed, setElapsed] = useState(0);

  const runningTask = runningEntry
    ? tasks.find((t) => t.id === runningEntry.taskId)
    : null;

  useEffect(() => {
    if (!runningEntry) {
      setElapsed(0);
      return;
    }
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(runningEntry.startedAt).getTime()) / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  // Warn if timer has been running for more than 12 hours (once)
  useEffect(() => {
    if (elapsed > 43200 && elapsed % 3600 === 0) {
      useTimekeeperStore.getState(); // noop to silence lint
    }
  }, [elapsed]);

  if (!runningEntry) return null;

  return (
    <div className="px-3 mb-2">
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-accent-50 border border-accent-200 text-accent-700">
        <Timer size={13} className="flex-shrink-0 text-accent-500 animate-pulse" />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => runningTask && openTaskModal(runningTask)}
        >
          <p className="text-xs font-medium truncate leading-tight">
            {runningTask?.title ?? 'Running task'}
          </p>
          <p className="text-xs font-mono text-accent-500 leading-tight">
            {formatElapsed(elapsed)}
          </p>
        </div>
        <button
          onClick={() => stopRunningTimer()}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-accent-100 text-accent-500 transition-colors"
          title="Stop timer"
        >
          <Square size={11} className="fill-current" />
        </button>
      </div>
      {elapsed > 43200 && (
        <p className="text-xs text-amber-600 mt-1 px-1">
          Timer running a long time — did you forget to stop it?
        </p>
      )}
    </div>
  );
}
