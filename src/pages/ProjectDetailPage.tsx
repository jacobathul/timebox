import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, CheckCircle2, Archive, Trash2, Calendar } from 'lucide-react';
import { useProjectStore, computeProjectStats } from '../store/useProjectStore';
import { useTaskStore } from '../store/useTaskStore';
import { useContextStore } from '../store/useContextStore';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import { ProjectStatusBadge } from '../components/projects/ProjectStatusBadge';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { ProjectTaskList } from '../components/projects/ProjectTaskList';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, markProjectComplete, archiveProject } = useProjectStore();
  const tasks = useTaskStore((s) => s.tasks);
  const contexts = useContextStore((s) => s.contexts);

  const [showEdit, setShowEdit] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const stats = useMemo(() => project ? computeProjectStats(project, tasks) : undefined, [project, tasks]);
  const context = project?.context_id ? contexts.find((c) => c.id === project.context_id) : undefined;

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-8 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <Link to="/app/projects" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-3 transition-colors w-fit">
            <ArrowLeft size={14} />
            Projects
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: accentColor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-stone-800">{project.name}</h1>
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors">
                <Pencil size={13} /> Edit
              </button>
              {project.status !== 'completed' && (
                <button onClick={handleMarkComplete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors">
                  <CheckCircle2 size={13} /> Complete
                </button>
              )}
              {project.status !== 'archived' && (
                <button onClick={() => setShowConfirmArchive(true)}
                  className="p-1.5 rounded-xl text-stone-400 border border-stone-200 hover:bg-stone-50 hover:text-stone-600 transition-colors" title="Archive">
                  <Archive size={15} />
                </button>
              )}
              <button onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 rounded-xl text-red-400 border border-red-200 hover:bg-red-50 transition-colors" title="Delete">
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
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <ProjectTaskList projectId={project.id} projectContextId={project.context_id} />
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

function ConfirmDialog({ title, body, confirmLabel, confirmStyle, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; confirmStyle: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal p-6 space-y-4">
        <h2 className="font-semibold text-stone-800">{title}</h2>
        <p className="text-sm text-stone-500">{body}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${confirmStyle} transition-colors shadow-sm`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
