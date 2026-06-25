import { Timer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTaskStore } from '../store/useTaskStore';
import { timeToPixels, durationToPixels } from '../utils/time';
import type { TaskTimeEntry } from '../types';

interface Props {
  entry: TaskTimeEntry;
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ActualTimeBlock({ entry }: Props) {
  const { tasks } = useTaskStore();
  const { openTaskModal } = useStore();

  const task = tasks.find((t) => t.id === entry.taskId);
  const isRunning = !entry.endedAt;

  const startHHMM = isoToHHMM(entry.startedAt);
  const endHHMM = entry.endedAt ? isoToHHMM(entry.endedAt) : isoToHHMM(new Date().toISOString());

  const startMins = parseInt(startHHMM.split(':')[0], 10) * 60 + parseInt(startHHMM.split(':')[1], 10);
  const endMins = parseInt(endHHMM.split(':')[0], 10) * 60 + parseInt(endHHMM.split(':')[1], 10);
  const durationMins = Math.max(endMins - startMins, 15);

  const top = timeToPixels(startHHMM);
  const height = Math.max(durationToPixels(durationMins), 20);

  const style: React.CSSProperties = {
    position: 'absolute',
    top,
    left: '60%',
    right: 0,
    height,
    zIndex: 5,
  };

  return (
    <div
      style={style}
      className={`rounded-lg border px-1.5 py-1 cursor-pointer transition-opacity hover:opacity-90 ${
        isRunning
          ? 'bg-accent-100 border-accent-300 border-dashed'
          : 'bg-stone-100 border-stone-300'
      }`}
      onClick={() => task && openTaskModal(task)}
      title={`Actual: ${task?.title ?? 'Task'}`}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <Timer size={9} className={isRunning ? 'text-accent-500 animate-pulse flex-shrink-0' : 'text-stone-400 flex-shrink-0'} />
        <span className="text-xs font-medium truncate text-stone-500">
          {task?.title}
        </span>
      </div>
    </div>
  );
}
