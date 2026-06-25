import { Calendar, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { AppProjectWithStats } from '../../types';
import { useContextStore } from '../../store/useContextStore';
import { ProjectProgressBar } from './ProjectProgressBar';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { ProjectContextMenu } from './ProjectContextMenu';

interface Props {
  project: AppProjectWithStats;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: Props) {
  const contexts = useContextStore((s) => s.contexts);
  const context = project.context_id ? contexts.find((c) => c.id === project.context_id) : undefined;

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const accentColor = project.color ?? context?.color ?? '#6b7280';
  const isOverdue = project.due_date && project.status === 'active' && new Date(project.due_date) < new Date();

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }

  function handleMenuButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxMenu({ x: rect.right, y: rect.bottom + 4 });
  }

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
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
            <button
              type="button"
              aria-label="Project actions"
              onClick={handleMenuButtonClick}
              className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>
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

      {ctxMenu && (
        <ProjectContextMenu
          project={project}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}
