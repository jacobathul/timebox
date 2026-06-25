import { Calendar, MoreHorizontal, Pencil, Archive, CheckCircle2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AppProjectWithStats } from '../../types';
import { useContextStore } from '../../store/useContextStore';
import { ProjectProgressBar } from './ProjectProgressBar';
import { ProjectStatusBadge } from './ProjectStatusBadge';

interface Props {
  project: AppProjectWithStats;
  onClick: () => void;
  onEdit: () => void;
  onMarkComplete: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onClick, onEdit, onMarkComplete, onArchive, onDelete }: Props) {
  const contexts = useContextStore((s) => s.contexts);
  const context = project.context_id ? contexts.find((c) => c.id === project.context_id) : undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const accentColor = project.color ?? context?.color ?? '#6b7280';
  const isOverdue = project.due_date && project.status === 'active' && new Date(project.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-stone-200 shadow-card hover:shadow-card-hover hover:border-stone-300 transition-all cursor-pointer p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: accentColor }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-stone-800 truncate">{project.name}</h3>
          {context && (
            <span className="text-xs font-medium mt-0.5 inline-block px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${context.color}18`, color: context.color }}>
              {context.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <ProjectStatusBadge status={project.status} />
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 bg-white rounded-xl border border-stone-200 shadow-dropdown py-1 w-44">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
                  <Pencil size={13} /> Edit
                </button>
                {project.status !== 'completed' && (
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMarkComplete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                    <CheckCircle2 size={13} /> Mark complete
                  </button>
                )}
                {project.status !== 'archived' && (
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onArchive(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50">
                    <Archive size={13} /> Archive
                  </button>
                )}
                <div className="my-1 border-t border-stone-100" />
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-stone-400 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div>
        <ProjectProgressBar percentage={project.progressPercentage} color={accentColor} />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-stone-400">
            {project.totalTasks === 0
              ? 'No tasks yet'
              : `${project.completedTasks} of ${project.totalTasks} tasks done`}
          </span>
          {project.remainingTasks > 0 && (
            <span className="text-xs text-stone-400">{project.remainingTasks} remaining</span>
          )}
        </div>
      </div>

      {/* Footer */}
      {project.due_date && (
        <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500' : 'text-stone-400'}`}>
          <Calendar size={11} />
          Due {new Date(project.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {isOverdue && ' · Overdue'}
        </div>
      )}
    </div>
  );
}
