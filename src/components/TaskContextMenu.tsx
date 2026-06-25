import React from 'react';
import {
  CalendarCheck, Calendar, Inbox, CheckCircle2, Circle,
  Pencil, Copy, Trash2, Timer,
} from 'lucide-react';
import { ContextMenu, ContextMenuItem, ContextMenuDivider, ContextMenuSubmenu } from './ui/ContextMenu';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useTaskStore } from '../store/useTaskStore';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { useStore } from '../store/useStore';
import { useToast } from '../store/useToastStore';
import { todayStr, dateOffsetStr } from '../utils/time';
import type { Task } from '../types';
import { RecurringTaskScopeDialog } from './recurrence/RecurringTaskScopeDialog';

interface Props {
  task: Task;
  x: number;
  y: number;
  onClose: () => void;
  onLogTime?: () => void;
}

export function TaskContextMenu({ task, x, y, onClose, onLogTime }: Props) {
  const {
    addTaskToToday, moveTaskToDate, moveTaskToInbox,
    completeTask, uncompleteTask, duplicateTask, deleteTask,
  } = useTaskStore();
  const { archiveRecurringTemplate, deleteFutureInstancesForTemplate } = useRecurringTaskStore();
  const { openTaskModal } = useStore();
  const toast = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [customDate, setCustomDate] = React.useState('');

  const today = todayStr();
  const isAlreadyToday = task.scheduledDate === today && task.status !== 'completed';
  const isInbox = task.status === 'inbox' && !task.scheduledDate;
  const isCompleted = task.status === 'completed';

  function getThisWeekend(): string {
    const d = new Date();
    const day = d.getDay(); // 0=Sun, 6=Sat
    const daysUntilSat = day === 6 ? 7 : 6 - day || 7;
    d.setDate(d.getDate() + daysUntilSat);
    return d.toISOString().split('T')[0];
  }

  function getNextMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const daysUntilMon = day === 1 ? 7 : (8 - day) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMon);
    return d.toISOString().split('T')[0];
  }

  function handleAddToToday() {
    addTaskToToday(task.id);
    toast.success('Added to today.');
    onClose();
  }

  function handleMoveToDate(date: string, label: string) {
    moveTaskToDate(task.id, date);
    toast.success(`Moved to ${label}.`);
    onClose();
  }

  function handleMoveToInbox() {
    moveTaskToInbox(task.id);
    toast.success('Moved to inbox.');
    onClose();
  }

  function handleToggleComplete() {
    if (isCompleted) {
      uncompleteTask(task.id);
      toast.success('Marked incomplete.');
    } else {
      completeTask(task.id);
      toast.success('Marked complete.');
    }
    onClose();
  }

  function handleEdit() {
    openTaskModal(task);
    onClose();
  }

  function handleDuplicate() {
    duplicateTask(task.id);
    toast.success('Task duplicated.');
    onClose();
  }

  function handleCustomDateConfirm() {
    if (!customDate) return;
    const label = new Date(customDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
    handleMoveToDate(customDate, label);
  }

  if (showDeleteConfirm) {
    if (task.recurringTemplateId) {
      return (
        <RecurringTaskScopeDialog
          mode="delete"
          taskTitle={task.title}
          onThisOnly={() => {
            deleteTask(task.id);
            toast.success('Task deleted.');
            onClose();
          }}
          onEntireSeries={() => {
            if (task.recurringTemplateId) {
              deleteTask(task.id);
              void archiveRecurringTemplate(task.recurringTemplateId);
              void deleteFutureInstancesForTemplate(task.recurringTemplateId, task.recurrenceInstanceDate ?? todayStr());
            }
            toast.success('Recurring series deleted.');
            onClose();
          }}
          onCancel={onClose}
        />
      );
    }
    return (
      <ConfirmDialog
        title="Delete task?"
        body={`"${task.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        confirmStyle="bg-red-500 hover:bg-red-600"
        onConfirm={() => {
          deleteTask(task.id);
          toast.success('Task deleted.');
          onClose();
        }}
        onCancel={onClose}
      />
    );
  }

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <ContextMenuItem
        icon={<CalendarCheck size={14} />}
        label={isAlreadyToday ? 'Already today' : 'Add to Today'}
        onClick={handleAddToToday}
        disabled={isAlreadyToday}
      />

      <ContextMenuSubmenu icon={<Calendar size={14} />} label="Add to Later">
        <ContextMenuItem
          label="Tomorrow"
          onClick={() => handleMoveToDate(dateOffsetStr(1), 'tomorrow')}
        />
        <ContextMenuItem
          label="This weekend"
          onClick={() => handleMoveToDate(getThisWeekend(), 'this weekend')}
        />
        <ContextMenuItem
          label="Next Monday"
          onClick={() => handleMoveToDate(getNextMonday(), 'next Monday')}
        />
        {!showDatePicker ? (
          <ContextMenuItem
            label="Pick a date…"
            onClick={() => setShowDatePicker(true)}
          />
        ) : (
          <div className="px-3 py-2 flex gap-2 items-center">
            <input
              type="date"
              value={customDate}
              min={dateOffsetStr(1)}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-400"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomDateConfirm}
              disabled={!customDate}
              className="text-xs font-semibold text-accent-500 hover:text-accent-600 disabled:text-stone-300 transition-colors"
            >
              Go
            </button>
          </div>
        )}
      </ContextMenuSubmenu>

      {!isInbox && (
        <ContextMenuItem
          icon={<Inbox size={14} />}
          label="Move to Inbox"
          onClick={handleMoveToInbox}
        />
      )}

      <ContextMenuDivider />

      <ContextMenuItem
        icon={isCompleted ? <Circle size={14} /> : <CheckCircle2 size={14} />}
        label={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
        onClick={handleToggleComplete}
      />

      <ContextMenuItem
        icon={<Pencil size={14} />}
        label="Edit Task"
        onClick={handleEdit}
      />

      <ContextMenuItem
        icon={<Copy size={14} />}
        label="Duplicate Task"
        onClick={handleDuplicate}
      />

      {onLogTime && (
        <ContextMenuItem
          icon={<Timer size={14} />}
          label="Log time manually"
          onClick={() => { onLogTime(); onClose(); }}
        />
      )}

      <ContextMenuDivider />

      <ContextMenuItem
        icon={<Trash2 size={14} />}
        label="Delete Task"
        onClick={() => setShowDeleteConfirm(true)}
        destructive
      />
    </ContextMenu>
  );
}
