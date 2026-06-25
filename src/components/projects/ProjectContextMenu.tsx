import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, ListTodo, SlidersHorizontal, Plus,
  CheckCircle2, RotateCcw, Pencil, Archive, Trash2,
} from 'lucide-react';
import { ContextMenu, ContextMenuItem, ContextMenuDivider } from '../ui/ContextMenu';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProjectFormDialog } from './ProjectFormDialog';
import { useProjectStore } from '../../store/useProjectStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToastStore';
import type { AppProjectWithStats } from '../../types';

interface Props {
  project: AppProjectWithStats;
  x: number;
  y: number;
  onClose: () => void;
}

type Overlay = 'edit' | 'confirmComplete' | 'confirmArchive' | 'confirmDelete';

export function ProjectContextMenu({ project, x, y, onClose }: Props) {
  const navigate = useNavigate();
  const { updateProject, deleteProject, markProjectComplete, reopenProject, archiveProject } = useProjectStore();
  const tasks = useTaskStore((s) => s.tasks);
  const { openTaskModal } = useStore();
  const toast = useToast();

  const [overlay, setOverlay] = React.useState<Overlay | null>(null);

  const remainingCount = tasks.filter(
    (t) => t.projectId === project.id && t.status !== 'completed',
  ).length;

  function handleScheduleTasks() {
    navigate(`/app/plan?projectId=${project.id}`);
    onClose();
  }

  function handleShowRemaining() {
    navigate(`/app/projects/${project.id}?filter=remaining`);
    onClose();
  }

  function handleShowUnplanned() {
    navigate(`/app/projects/${project.id}?filter=unplanned`);
    onClose();
  }

  function handleAddTask() {
    openTaskModal({
      projectId: project.id,
      contextId: project.context_id,
    } as Parameters<typeof openTaskModal>[0]);
    onClose();
  }

  function handleMarkComplete() {
    if (remainingCount > 0) {
      setOverlay('confirmComplete');
    } else {
      markProjectComplete(project.id);
      toast.success('Project marked complete.');
      onClose();
    }
  }

  function handleReopen() {
    reopenProject(project.id);
    toast.success('Project reopened.');
    onClose();
  }

  if (overlay === 'edit') {
    return (
      <ProjectFormDialog
        editing={project}
        onConfirm={(data) => {
          updateProject(project.id, data);
          onClose();
        }}
        onClose={onClose}
      />
    );
  }

  if (overlay === 'confirmComplete') {
    return (
      <ConfirmDialog
        title={`Mark "${project.name}" complete?`}
        body={`${remainingCount} task${remainingCount !== 1 ? 's are' : ' is'} still unfinished. Tasks will NOT be completed automatically.`}
        confirmLabel="Mark complete anyway"
        confirmStyle="bg-emerald-500 hover:bg-emerald-600"
        onConfirm={() => {
          markProjectComplete(project.id);
          toast.success('Project marked complete.');
          onClose();
        }}
        onCancel={onClose}
      />
    );
  }

  if (overlay === 'confirmArchive') {
    return (
      <ConfirmDialog
        title={`Archive "${project.name}"?`}
        body="Archived projects are hidden from the active list but their tasks remain intact."
        confirmLabel="Archive"
        confirmStyle="bg-stone-600 hover:bg-stone-700"
        onConfirm={() => {
          archiveProject(project.id);
          toast.success('Project archived.');
          onClose();
        }}
        onCancel={onClose}
      />
    );
  }

  if (overlay === 'confirmDelete') {
    return (
      <ConfirmDialog
        title={`Delete "${project.name}"?`}
        body="Tasks in this project will not be deleted but will lose their project assignment. This cannot be undone."
        confirmLabel="Delete"
        confirmStyle="bg-red-500 hover:bg-red-600"
        onConfirm={() => {
          deleteProject(project.id);
          toast.success('Project deleted.');
          onClose();
        }}
        onCancel={onClose}
      />
    );
  }

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <ContextMenuItem
        icon={<CalendarDays size={14} />}
        label="Schedule Tasks"
        onClick={handleScheduleTasks}
      />
      <ContextMenuItem
        icon={<ListTodo size={14} />}
        label="Show Remaining Tasks"
        onClick={handleShowRemaining}
      />
      <ContextMenuItem
        icon={<SlidersHorizontal size={14} />}
        label="Show Unplanned Tasks"
        onClick={handleShowUnplanned}
      />
      <ContextMenuItem
        icon={<Plus size={14} />}
        label="Add Task to Project"
        onClick={handleAddTask}
      />

      <ContextMenuDivider />

      {project.status !== 'completed' ? (
        <ContextMenuItem
          icon={<CheckCircle2 size={14} />}
          label="Mark Project Complete"
          onClick={handleMarkComplete}
        />
      ) : (
        <ContextMenuItem
          icon={<RotateCcw size={14} />}
          label="Reopen Project"
          onClick={handleReopen}
        />
      )}
      <ContextMenuItem
        icon={<Pencil size={14} />}
        label="Edit Project"
        onClick={() => setOverlay('edit')}
      />
      {project.status !== 'archived' && (
        <ContextMenuItem
          icon={<Archive size={14} />}
          label="Archive Project"
          onClick={() => setOverlay('confirmArchive')}
        />
      )}

      <ContextMenuDivider />

      <ContextMenuItem
        icon={<Trash2 size={14} />}
        label="Delete Project"
        onClick={() => setOverlay('confirmDelete')}
        destructive
      />
    </ContextMenu>
  );
}
