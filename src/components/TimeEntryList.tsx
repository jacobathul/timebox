import { useEffect, useState } from 'react';
import { Pencil, Trash2, Timer, ClipboardList } from 'lucide-react';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { ManualTimeEntryDialog } from './ManualTimeEntryDialog';
import { formatDuration, formatElapsed } from '../utils/time';
import type { TaskTimeEntry } from '../types';

interface Props {
  taskId: string;
  taskTitle: string;
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEntryTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function TimeEntryRow({
  entry,
  taskId,
  taskTitle,
  isRunning,
}: {
  entry: TaskTimeEntry;
  taskId: string;
  taskTitle: string;
  isRunning: boolean;
}) {
  const { deleteTimeEntry } = useTimekeeperStore();
  const [editOpen, setEditOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const update = () =>
      setElapsed(Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunning, entry.startedAt]);

  return (
    <>
      <div className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0 group">
        <div className="flex-shrink-0 mt-0.5">
          {entry.entryType === 'timer' ? (
            <Timer size={13} className={isRunning ? 'text-accent-500' : 'text-stone-300'} />
          ) : (
            <ClipboardList size={13} className="text-stone-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="font-medium">{formatEntryDate(entry.startedAt)}</span>
            <span className="text-stone-300">·</span>
            <span>{formatEntryTime(entry.startedAt)}</span>
            {!isRunning && entry.endedAt && (
              <>
                <span className="text-stone-300">→</span>
                <span>{formatEntryTime(entry.endedAt)}</span>
              </>
            )}
            {isRunning && (
              <span className="font-mono text-accent-600 animate-pulse">
                {formatElapsed(elapsed)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isRunning ? (
              <span className="text-xs text-accent-500 font-medium">Running…</span>
            ) : (
              <span className="text-xs font-medium text-stone-700">
                {entry.durationMinutes ? formatDuration(entry.durationMinutes) : '—'}
              </span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
              entry.entryType === 'timer'
                ? 'bg-accent-50 text-accent-600'
                : 'bg-stone-100 text-stone-500'
            }`}>
              {entry.entryType}
            </span>
            {entry.notes && (
              <span className="text-xs text-stone-400 truncate max-w-[120px]">{entry.notes}</span>
            )}
          </div>
        </div>

        {!isRunning && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => deleteTimeEntry(entry.id, taskId)}
              className="p-1 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <ManualTimeEntryDialog
          taskId={taskId}
          taskTitle={taskTitle}
          editEntry={entry}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

export function TimeEntryList({ taskId, taskTitle }: Props) {
  const { entries, fetchTimeEntriesForTask, runningEntry } = useTimekeeperStore();
  const [showManualDialog, setShowManualDialog] = useState(false);

  useEffect(() => {
    fetchTimeEntriesForTask(taskId);
  }, [taskId, fetchTimeEntriesForTask]);

  const taskEntries: TaskTimeEntry[] = entries[taskId] ?? [];
  const runningThisTask = runningEntry?.taskId === taskId ? runningEntry : null;

  // Merge: running entry at top if not already in list
  const allEntries = runningThisTask && !taskEntries.find((e) => e.id === runningThisTask.id)
    ? [runningThisTask, ...taskEntries]
    : taskEntries;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Timekeeper
        </h3>
        <button
          onClick={() => setShowManualDialog(true)}
          className="text-xs text-accent-500 hover:text-accent-700 font-medium"
        >
          Log time manually
        </button>
      </div>

      {allEntries.length === 0 ? (
        <p className="text-xs text-stone-400 py-2">No time tracked yet.</p>
      ) : (
        <div className="bg-stone-50 rounded-xl border border-stone-100 px-3">
          {allEntries.map((entry) => (
            <TimeEntryRow
              key={entry.id}
              entry={entry}
              taskId={taskId}
              taskTitle={taskTitle}
              isRunning={runningEntry?.id === entry.id}
            />
          ))}
        </div>
      )}

      {showManualDialog && (
        <ManualTimeEntryDialog
          taskId={taskId}
          taskTitle={taskTitle}
          onClose={() => setShowManualDialog(false)}
        />
      )}
    </div>
  );
}
