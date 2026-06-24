import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { ContextTreeNode, ProjectContext } from '../../types';
import { MAX_DEPTH } from '../../store/useContextStore';
import { ContextFormDialog } from './ContextFormDialog';

interface Props {
  node: ContextTreeNode;
  taskCount: number;
  childrenTaskCounts: Record<string, number>;
  onAdd: (parentId: string, name: string, color: string) => void;
  onEdit: (id: string, name: string, color: string) => void;
  onDelete: (ctx: ProjectContext) => void;
}

export function ContextTreeItem({ node, taskCount, childrenTaskCounts, onAdd, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const hasChildren = node.children.length > 0;
  const canAddChild = node.depth < MAX_DEPTH;

  return (
    <div>
      <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-stone-50 transition-colors">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`w-5 h-5 flex items-center justify-center text-stone-300 flex-shrink-0 transition-transform ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Color dot */}
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-stone-700 truncate">{node.name}</span>

        {/* Task count badge */}
        {taskCount > 0 && (
          <span className="text-xs text-stone-400 flex-shrink-0">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canAddChild && (
            <button onClick={() => setShowAddDialog(true)} className="p-1 rounded-lg text-stone-400 hover:text-accent-500 hover:bg-accent-50 transition-colors" title="Add sub-context">
              <Plus size={13} />
            </button>
          )}
          <button onClick={() => setShowEditDialog(true)} className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="Rename / recolor">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(node)} className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete context">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-7 border-l border-stone-100 pl-2 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <ContextTreeItem
              key={child.id}
              node={child}
              taskCount={childrenTaskCounts[child.id] ?? 0}
              childrenTaskCounts={childrenTaskCounts}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {showAddDialog && (
        <ContextFormDialog
          parentContext={node}
          onConfirm={(name, color) => onAdd(node.id, name, color)}
          onClose={() => setShowAddDialog(false)}
        />
      )}
      {showEditDialog && (
        <ContextFormDialog
          editing={node}
          onConfirm={(name, color) => onEdit(node.id, name, color)}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
}

export function DeleteContextWarning({ ctx, taskCount, childCount, onConfirm, onCancel }: {
  ctx: ProjectContext;
  taskCount: number;
  childCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <h2 className="font-semibold text-stone-800">Delete "{ctx.name}"?</h2>
        </div>
        {(taskCount > 0 || childCount > 0) && (
          <ul className="text-sm text-stone-600 space-y-1">
            {taskCount > 0 && <li>• {taskCount} task{taskCount !== 1 ? 's' : ''} will lose their context assignment</li>}
            {childCount > 0 && <li>• {childCount} sub-context{childCount !== 1 ? 's' : ''} will also be deleted</li>}
          </ul>
        )}
        <p className="text-sm text-stone-500">This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}
