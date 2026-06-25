import React from 'react';
import { CheckCircle2, Circle, GripVertical, AlertTriangle } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { useContextStore } from '../store/useContextStore';
import { useProjectStore } from '../store/useProjectStore';
import { useStore } from '../store/useStore';
import { timeToPixels, durationToPixels, timeToMinutes, formatTime } from '../utils/time';
import { TimekeeperButton } from './TimekeeperButton';
import { RecurringTaskBadge } from './recurrence/RecurringTaskBadge';

interface Props {
  task: Task;
  hasOverlap?: boolean;
  onResizeStart?: (taskId: string, e: React.MouseEvent) => void;
}

const PRIORITY_COLORS = {
  high:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700' },
  medium: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
  low:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
};

export function ScheduledTaskBlock({ task, hasOverlap = false, onResizeStart }: Props) {
  const { completeTask, uncompleteTask } = useTaskStore();
  const { getById } = useContextStore();
  const projects = useProjectStore((s) => s.projects);
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const { openTaskModal } = useStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cal-${task.id}`,
    data: { type: 'task', taskId: task.id, source: 'calendar' },
  });

  if (!task.startTime || !task.endTime) return null;

  const top = timeToPixels(task.startTime);
  const durationMins = timeToMinutes(task.endTime) - timeToMinutes(task.startTime);
  const height = Math.max(durationToPixels(durationMins), 28);

  const isCompleted = task.status === 'completed';
  const colors = PRIORITY_COLORS[task.priority];
  const context = task.contextId ? getById(task.contextId) : undefined;
  const isShort = height < 50;

  const style: React.CSSProperties = {
    position: 'absolute',
    top,
    left: 0,
    right: 0,
    height,
    opacity: isDragging ? 0.3 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 100 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group rounded-xl border px-2.5 py-1.5 flex flex-col cursor-pointer select-none
        transition-shadow hover:shadow-card-hover
        ${isCompleted ? 'bg-stone-50 border-stone-200 opacity-60' : `${colors.bg} ${colors.border}`}
        ${hasOverlap ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
      `}
      onClick={() => openTaskModal(task)}
    >
      <div className="flex items-start gap-1.5 flex-1 min-h-0">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-0.5 text-stone-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (isCompleted) uncompleteTask(task.id); else completeTask(task.id); }}
          className="flex-shrink-0 mt-0.5 text-stone-300 hover:text-accent-500 transition-colors"
        >
          {isCompleted ? <CheckCircle2 size={13} className="text-accent-400" /> : <Circle size={13} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <p className={`text-xs font-semibold leading-tight truncate ${isCompleted ? 'line-through text-stone-400' : colors.text}`}>
              {task.title}
            </p>
            {task.recurringTemplateId && <RecurringTaskBadge />}
          </div>
          {!isShort && <p className="text-xs text-stone-400 mt-0.5">{formatTime(task.startTime!)} – {formatTime(task.endTime!)}</p>}
          {!isShort && (project || context) && (
            <span className="inline-block text-xs mt-1 px-1.5 py-0.5 rounded font-medium"
              style={project
                ? { backgroundColor: `${project.color ?? '#6b7280'}20`, color: project.color ?? '#6b7280' }
                : { backgroundColor: `${context!.color}20`, color: context!.color }}>
              {project ? project.name : context!.name}
            </span>
          )}
        </div>

        {hasOverlap && <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />}
        {!isCompleted && !isShort && (
          <TimekeeperButton taskId={task.id} taskTitle={task.title} />
        )}
      </div>

      {onResizeStart && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(task.id, e); }}
        >
          <div className="w-8 h-0.5 rounded-full bg-stone-300" />
        </div>
      )}
    </div>
  );
}
