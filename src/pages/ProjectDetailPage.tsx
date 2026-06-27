import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, CheckCircle2, Archive, Trash2, Calendar } from 'lucide-react';
import { useProjectStore, computeProjectStats } from '../store/useProjectStore';
import { useTaskStore } from '../store/useTaskStore';
import { useContextStore } from '../store/useContextStore';
import { useWeeklyPlanStore } from '../store/useWeeklyPlanStore';
import { usePlanningWarningsStore } from '../store/usePlanningWarningsStore';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import { ProjectStatusBadge } from '../components/projects/ProjectStatusBadge';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { ProjectTaskList } from '../components/projects/ProjectTaskList';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PlanningWarningBanner } from '../components/planning/PlanningWarningBanner';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') as 'remaining' | 'unplanned' | 'completed' | null;

  const { projects, updateProject, deleteProject, markProjectComplete, archiveProject } = useProjectStore();
  const tasks = useTaskStore((s) => s.tasks);
  const contexts = useContextStore((s) => s.contexts);
  const currentWeeklyPlan = useWeeklyPlanStore((s) => s.currentWeeklyPlan);

  const [showEdit, setShowEdit] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const stats = useMemo(() => project ? computeProjectStats(project, tasks) : undefined, [project, tasks]);
  const context = project?.context_id ? contexts.find((c) => c.id === project.context_id) : undefined;
  const { warnings: allWarnings, dismissedWarningIds } = usePlanningWarningsStore();

  const deadlineWarnings = project
    ? allWarnings.filter(
        (w) =>
          w.projectId === project.id &&
          w.type === 'project_deadline_capacity_risk' &&
          !dismissedWarningIds.includes(w.id),
      )
    : [];

  if (!project || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <p className="text-stone-500 text-sm">Project not found.</p>
          <Link to="/app/projects" className="mt-2 text-sm text-accent-500 hover:text-accent-600 transition-colors">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const accentColor = project.color ?? context?.color ?? '#6b7280';
  const hasIncomplete = stats.remainingTasks > 0;

  function handleMarkComplete() {
    if (hasIncomplete) { setShowConfirmComplete(true); return; }
    markProjectComplete(project!.id);
  }

  const filterLabel = filter === 'remaining'
    ? 'Remaining tasks'
    : filter === 'unplanned'
      ? 'Unplanned tasks'
      : filter === 'completed'
        ? 'Completed tasks'
        : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <Link to="/app/projects" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-3 transition-colors w-fit">
            <ArrowLeft size={14} />
            Projects
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: accentColor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-semibold text-stone-800 min-w-0">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              {context && (
                <span className="text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${context.color}18`, color: context.color }}>
                  {context.name}
                </span>
              )}
              {project.description && (
                <p className="text-sm text-stone-500 mt-1.5">{project.description}</p>
              )}
              {project.due_date && (
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1.5">
                  <Calendar size={11} />
                  Due {new Date(project.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 flex-wrap justify-end">
              <button
                onClick={() => navigate(`/app/weekly-planning?projectId=${project.id}`)}
                className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-sm font-medium text-accent-600 border border-accent-200 hover:bg-accent-50 transition-colors min-h-[44px] md:min-h-0"
              >
                <Calendar size={13} /> <span className="hidden sm:inline">Plan this week</span>
              </button>
              {currentWeeklyPlan?.selected_project_ids.includes(project.id) && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium bg-accent-50 text-accent-600 border border-accent-200">
                  Selected for this week
                </span>
              )}
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors min-h-[44px] md:min-h-0">
                <Pencil size={13} /> <span className="hidden sm:inline">Edit</span>
              </button>
              {project.status !== 'completed' && (
                <button onClick={handleMarkComplete}
                  className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-sm font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors min-h-[44px] md:min-h-0">
                  <CheckCircle2 size={13} /> <span className="hidden sm:inline">Complete</span>
                </button>
              )}
              {project.status !== 'archived' && (
                <button onClick={() => setShowConfirmArchive(true)}
                  className="p-2 rounded-xl text-stone-400 border border-stone-200 hover:bg-stone-50 hover:text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0" title="Archive">
                  <Archive size={15} />
                </button>
              )}
              <button onClick={() => setShowConfirmDelete(true)}
                className="p-2 rounded-xl text-red-400 border border-red-200 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0" title="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <ProjectProgressBar percentage={stats.progressPercentage} color={accentColor} />
            <div className="flex gap-4 mt-2 text-xs text-stone-400">
              <span>{stats.completedTasks} completed</span>
              <span>{stats.remainingTasks} remaining</span>
              <span>{stats.totalTasks} total</span>
            </div>
          </div>

          {/* Deadline capacity warnings */}
          {deadlineWarnings.length > 0 && (
            <div className="mt-4">
              <PlanningWarningBanner warnings={deadlineWarnings} />
            </div>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6">
          {filterLabel && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full">
                Filtered: {filterLabel}
              </span>
              <Link
                to={`/app/projects/${project.id}`}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Show all
              </Link>
            </div>
          )}
          <ProjectTaskList
            projectId={project.id}
            projectContextId={project.context_id}
            filter={filter ?? undefined}
          />
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <ProjectFormDialog
          editing={project}
          onConfirm={(data) => updateProject(project.id, data)}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showConfirmComplete && (
        <ConfirmDialog
          title={`Mark "${project.name}" complete?`}
          body={`${stats.remainingTasks} task${stats.remainingTasks !== 1 ? 's are' : ' is'} still unfinished. The tasks themselves will NOT be completed automatically.`}
          confirmLabel="Mark complete anyway"
          confirmStyle="bg-emerald-500 hover:bg-emerald-600"
          onConfirm={() => { markProjectComplete(project.id); setShowConfirmComplete(false); }}
          onCancel={() => setShowConfirmComplete(false)}
        />
      )}

      {showConfirmArchive && (
        <ConfirmDialog
          title={`Archive "${project.name}"?`}
          body="Archived projects are hidden from the active list but their tasks remain intact."
          confirmLabel="Archive"
          confirmStyle="bg-stone-600 hover:bg-stone-700"
          onConfirm={() => { archiveProject(project.id); setShowConfirmArchive(false); navigate('/app/projects'); }}
          onCancel={() => setShowConfirmArchive(false)}
        />
      )}

      {showConfirmDelete && (
        <ConfirmDialog
          title={`Delete "${project.name}"?`}
          body="Tasks in this project will not be deleted but will lose their project assignment. This cannot be undone."
          confirmLabel="Delete"
          confirmStyle="bg-red-500 hover:bg-red-600"
          onConfirm={() => { deleteProject(project.id); setShowConfirmDelete(false); navigate('/app/projects'); }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
}
