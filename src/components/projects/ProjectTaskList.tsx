import { useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useStore } from '../../store/useStore';
import { formatDuration } from '../../utils/time';

const PRIORITY_COLORS = {
  high: 'text-red-500 bg-red-50',
  medium: 'text-amber-500 bg-amber-50',
  low: 'text-emerald-500 bg-emerald-50',
};

interface Props {
  projectId: string;
  projectContextId?: string | null;
}

export function ProjectTaskList({ projectId, projectContextId }: Props) {
  const { tasks, completeTask, uncompleteTask } = useTaskStore();
  const { openTaskModal } = useStore();

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId],
  );
  const remaining = projectTasks.filter((t) => t.status !== 'completed');
  const completed = projectTasks.filter((t) => t.status === 'completed');

  function handleAddTask() {
    openTaskModal({ projectId, contextId: projectContextId ?? null } as Parameters<typeof openTaskModal>[0]);
  }

  function TaskRow({ task }: { task: (typeof tasks)[0] }) {
    const done = task.status === 'completed';
    return (
      <div
        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
        onClick={() => openTaskModal(task)}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); done ? uncompleteTask(task.id) : completeTask(task.id); }}
          className="flex-shrink-0 text-stone-300 hover:text-accent-500 transition-colors"
        >
          {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
        </button>
        <span className={`flex-1 text-sm truncate ${done ? 'line-through text-stone-400' : 'text-stone-700'}`}>
          {task.title}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <span className="flex items-center gap-1 text-xs text-stone-400 flex-shrink-0">
          <Clock size={10} />
          {formatDuration(task.estimatedMinutes)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Remaining */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Remaining ({remaining.length})
          </h3>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-1 text-xs text-accent-500 hover:text-accent-600 font-medium transition-colors"
          >
            <Plus size={13} />
            Add task
          </button>
        </div>
        {remaining.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-stone-200 rounded-xl">
            <p className="text-sm text-stone-400">No tasks yet. Add the first task for this project.</p>
            <button onClick={handleAddTask}
              className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors">
              <Plus size={14} /> Add task
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {remaining.map((t) => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
            Completed ({completed.length})
          </h3>
          <div className="space-y-0.5 opacity-70">
            {completed.map((t) => <TaskRow key={t.id} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
