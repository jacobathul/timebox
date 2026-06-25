import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useContextStore, buildContextTree, flattenContextTree } from '../../store/useContextStore';
import { useTaskStore } from '../../store/useTaskStore';
import { ContextTreeItem, DeleteContextWarning } from './ContextTreeItem';
import { ContextFormDialog } from './ContextFormDialog';
import type { ProjectContext } from '../../types';

export function ContextSettings() {
  const contexts = useContextStore((s) => s.contexts);
  const addContext = useContextStore((s) => s.addContext);
  const updateContext = useContextStore((s) => s.updateContext);
  const deleteContext = useContextStore((s) => s.deleteContext);
  const getChildCount = useContextStore((s) => s.getChildCount);
  const tasks = useTaskStore((s) => s.tasks);
  const [showCreateRoot, setShowCreateRoot] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectContext | null>(null);

  const tree = useMemo(() => buildContextTree(contexts), [contexts]);
  const flat = useMemo(() => flattenContextTree(tree), [tree]);

  const taskCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    flat.forEach((ctx) => { map[ctx.id] = tasks.filter((t) => t.contextId === ctx.id).length; });
    return map;
  }, [flat, tasks]);

  function handleAdd(parentId: string, name: string, color: string) {
    addContext(name, color, parentId);
  }

  function handleEdit(id: string, name: string, color: string) {
    updateContext(id, { name, color });
  }

  function handleDeleteRequest(ctx: ProjectContext) {
    setPendingDelete(ctx);
  }

  function handleDeleteConfirm() {
    if (pendingDelete) deleteContext(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-stone-700">Project Contexts</h3>
          <p className="text-xs text-stone-400 mt-0.5">Organize tasks into nested contexts up to 5 levels deep.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateRoot(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm"
        >
          <Plus size={13} />
          New
        </button>
      </div>

      {tree.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-3 text-center border border-dashed border-stone-200 rounded-2xl">
          <p className="text-sm text-stone-400">No contexts yet</p>
          <button
            type="button"
            onClick={() => setShowCreateRoot(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm"
          >
            <Plus size={14} />
            Create first context
          </button>
        </div>
      ) : (
        <div className="space-y-0.5">
          {tree.map((node) => (
            <ContextTreeItem
              key={node.id}
              node={node}
              taskCount={taskCountMap[node.id] ?? 0}
              childrenTaskCounts={taskCountMap}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {showCreateRoot && (
        <ContextFormDialog
          onConfirm={(name, color) => addContext(name, color, null)}
          onClose={() => setShowCreateRoot(false)}
        />
      )}

      {pendingDelete && (
        <DeleteContextWarning
          ctx={pendingDelete}
          taskCount={taskCountMap[pendingDelete.id] ?? 0}
          childCount={getChildCount(pendingDelete.id)}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
