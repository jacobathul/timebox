import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronDown, ChevronRight, FolderKanban } from 'lucide-react';
import { useProjectStore, computeProjectStats } from '../store/useProjectStore';
import { useTaskStore } from '../store/useTaskStore';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import type { AppProject } from '../types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject, updateProject, deleteProject, markProjectComplete, archiveProject } = useProjectStore();
  const tasks = useTaskStore((s) => s.tasks);

  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<AppProject | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AppProject | null>(null);

  const withStats = useMemo(
    () => projects.map((p) => computeProjectStats(p, tasks)),
    [projects, tasks],
  );

  const q = query.trim().toLowerCase();
  const filtered = q ? withStats.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)) : withStats;

  const active    = filtered.filter((p) => p.status === 'active');
  const completed = filtered.filter((p) => p.status === 'completed');
  const archived  = filtered.filter((p) => p.status === 'archived');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 md:py-5 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-stone-800">Projects</h1>
            <p className="text-sm text-stone-400 mt-0.5 hidden sm:block">Break big goals into tasks, track progress.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-sm flex-shrink-0 min-h-[44px]"
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 placeholder-stone-400 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>

          {/* Active projects */}
          <div>
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-4 border border-dashed border-stone-200 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <FolderKanban size={22} className="text-stone-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-600">No projects yet</p>
                  <p className="text-xs text-stone-400 mt-1">Create your first project to break big goals into manageable tasks.</p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-sm"
                >
                  <Plus size={14} /> New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                    onEdit={() => setEditingProject(p)}
                    onMarkComplete={() => markProjectComplete(p.id)}
                    onArchive={() => archiveProject(p.id)}
                    onDelete={() => setConfirmDelete(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed projects */}
          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted((s) => !s)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3 hover:text-stone-700 transition-colors"
              >
                {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Completed ({completed.length})
              </button>
              {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {completed.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => navigate(`/app/projects/${p.id}`)}
                      onEdit={() => setEditingProject(p)}
                      onMarkComplete={() => markProjectComplete(p.id)}
                      onArchive={() => archiveProject(p.id)}
                      onDelete={() => setConfirmDelete(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Archived projects */}
          {archived.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived((s) => !s)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3 hover:text-stone-700 transition-colors"
              >
                {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Archived ({archived.length})
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {archived.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => navigate(`/app/projects/${p.id}`)}
                      onEdit={() => setEditingProject(p)}
                      onMarkComplete={() => markProjectComplete(p.id)}
                      onArchive={() => archiveProject(p.id)}
                      onDelete={() => setConfirmDelete(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <ProjectFormDialog
          onConfirm={(data) => createProject(data)}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingProject && (
        <ProjectFormDialog
          editing={editingProject}
          onConfirm={(data) => updateProject(editingProject.id, data)}
          onClose={() => setEditingProject(null)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal p-6 space-y-4">
            <h2 className="font-semibold text-stone-800">Delete "{confirmDelete.name}"?</h2>
            <p className="text-sm text-stone-500">Tasks in this project will not be deleted but will lose their project assignment.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">Cancel</button>
              <button
                onClick={() => { deleteProject(confirmDelete.id); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
