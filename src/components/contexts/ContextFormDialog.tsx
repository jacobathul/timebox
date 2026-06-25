import { useState } from 'react';
import { X } from 'lucide-react';
import { ContextColorPicker } from './ContextColorPicker';
import { PRESET_COLORS, MAX_DEPTH } from '../../store/useContextStore';
import type { ProjectContext } from '../../types';

interface Props {
  parentContext?: ProjectContext | null;
  editing?: ProjectContext | null;
  onConfirm: (name: string, color: string) => void;
  onClose: () => void;
}

export function ContextFormDialog({ parentContext, editing, onConfirm, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? PRESET_COLORS[6]);

  const isEdit = !!editing;
  const parentDepth = parentContext?.depth ?? 0;
  const newDepth = parentDepth + 1;
  const atMaxDepth = !isEdit && newDepth > MAX_DEPTH;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || atMaxDepth) return;
    onConfirm(name.trim(), color);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-800">
            {isEdit ? 'Edit Context' : parentContext ? `New Context under "${parentContext.name}"` : 'New Top-Level Context'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {atMaxDepth && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              Maximum nesting depth ({MAX_DEPTH} levels) reached.
            </div>
          )}

          {!isEdit && parentContext && (
            <p className="text-xs text-stone-400">
              This will be nested {newDepth} level{newDepth !== 1 ? 's' : ''} deep under <strong>{parentContext.name}</strong>.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ciena, Fitness, CS7641…"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-2">Color</label>
            <ContextColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || atMaxDepth}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
