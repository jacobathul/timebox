import React from 'react';
import { CheckCircle2, Circle, Clock, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Task } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { useContextStore } from '../store/useContextStore';
import { useProjectStore } from '../store/useProjectStore';
import { useStore } from '../store/useStore';
import { formatDuration } from '../utils/time';

interface Props {
  task: Task;
  compact?: boolean;
  draggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  style?: React.CSSProperties;
  className?: string;
  showActions?: boolean;
}

const PRIORITY_STYLES = {
  high:   'border-l-red-400 bg-red-50',
  medium: 'border-l-amber-400 bg-amber-50',
  low:    'border-l-emerald-400 bg-emerald-50',
};

const PRIORITY_BADGE = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-emerald-100 text-emerald-700',
};

export function TaskCard({ task, compact = false, draggable, dragHandleProps, style, className = '', showActions = true }: Props) {
  const { completeTask, uncompleteTask, deleteTask } = useTaskStore();
  const { getById } = useContextStore();
  const projects = useProjectStore((s) => s.projects);
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const { openTaskModal } = useStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const context = task.contextId ? getById(task.contextId) : undefined;
  const isCompleted = task.status === 'completed';

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isCompleted) uncompleteTask(task.id);
    else completeTask(task.id);
  }

  return (
    <div
      style={style}
      className={`
        group relative flex items-start gap-2 px-3 py-2.5 rounded-xl border border-l-4 bg-white
        shadow-card hover:shadow-card-hover transition-all cursor-pointer select-none
        ${isCompleted ? 'opacity-50 border-l-stone-200' : PRIORITY_STYLES[task.priority]}
        ${className}
      `}
      onClick={() => openTaskModal(task)}
    >
      {draggable && (
        <div
          {...dragHandleProps}
          className="flex-shrink-0 mt-0.5 text-stone-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
      )}

      <button onClick={handleToggleComplete} className="flex-shrink-0 mt-0.5 text-stone-300 hover:text-accent-500 transition-colors">
        {isCompleted ? <CheckCircle2 size={16} className="text-accent-400" /> : <Circle size={16} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug truncate ${isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>
          {task.title}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {project && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${project.color ?? '#6b7280'}20`, color: project.color ?? '#6b7280' }}>
                {project.name}
              </span>
            )}
            {context && !project && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${context.color}20`, color: context.color }}>
                {context.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Clock size={11} />
              {formatDuration(task.estimatedMinutes)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${PRIORITY_BADGE[task.priority]}`}>
              {task.priority}
            </span>
          </div>
        )}
      </div>

      {showActions && (
        <div ref={menuRef} className="flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded-lg text-stone-300 hover:text-stone-500 hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-50 w-36 bg-white rounded-xl border border-stone-200 shadow-modal py-1">
              <button onClick={() => { openTaskModal(task); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
                Edit
              </button>
              <button onClick={() => { deleteTask(task.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
