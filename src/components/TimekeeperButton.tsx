import React, { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatElapsed } from '../utils/time';

interface Props {
  taskId: string;
  taskTitle: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function TimekeeperButton({ taskId, taskTitle, size = 'sm', className = '' }: Props) {
  const { user } = useAuthStore();
  const { runningEntry, startTimer, stopRunningTimer, loading } = useTimekeeperStore();
  const [elapsed, setElapsed] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const isRunningThisTask = runningEntry?.taskId === taskId;
  const isRunningOtherTask = !!runningEntry && !isRunningThisTask;

  useEffect(() => {
    if (!isRunningThisTask || !runningEntry) {
      setElapsed(0);
      return;
    }
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(runningEntry.startedAt).getTime()) / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunningThisTask, runningEntry]);

  if (!user) return null;

  const iconSize = size === 'sm' ? 12 : 14;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isRunningThisTask) {
      stopRunningTimer();
      return;
    }
    if (isRunningOtherTask) {
      setShowConfirm(true);
      return;
    }
    startTimer(taskId);
  }

  function handleConfirmSwitch(e: React.MouseEvent) {
    e.stopPropagation();
    setShowConfirm(false);
    startTimer(taskId);
  }

  function handleCancelConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setShowConfirm(false);
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      {isRunningThisTask ? (
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors text-xs font-mono font-medium"
          title="Stop timer"
        >
          <Square size={iconSize} className="fill-current" />
          {elapsed > 0 && <span>{formatElapsed(elapsed)}</span>}
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-1 p-1 rounded-lg text-stone-300 hover:text-accent-500 hover:bg-accent-50 transition-colors opacity-0 group-hover:opacity-100"
          title={isRunningOtherTask ? `Switch timer to "${taskTitle}"` : 'Start timer'}
        >
          <Play size={iconSize} className="fill-current" />
        </button>
      )}

      {showConfirm && (
        <div
          className="absolute right-0 top-7 z-50 w-56 bg-white rounded-xl border border-stone-200 shadow-modal p-3 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-stone-700 font-medium mb-1">Switch timer?</p>
          <p className="text-stone-400 mb-3">
            Another timer is running. Stop it and start this task?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancelConfirm}
              className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSwitch}
              className="flex-1 px-2 py-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600"
            >
              Switch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
