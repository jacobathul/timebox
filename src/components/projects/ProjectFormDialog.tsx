import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import type { AppProject } from '../../types';
import { ContextSelector } from '../contexts/ContextSelector';
import { ContextColorPicker } from '../contexts/ContextColorPicker';

interface FormData {
  name: string;
  description: string;
  context_id: string | null;
  color: string | null;
  due_date: string | null;
}

interface Props {
  editing?: AppProject | null;
  onConfirm: (data: FormData) => void;
  onClose: () => void;
}

export function ProjectFormDialog({ editing, onConfirm, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [contextId, setContextId] = useState<string | null>(editing?.context_id ?? null);
  const [color, setColor] = useState<string | null>(editing?.color ?? null);
  const [dueDate, setDueDate] = useState(editing?.due_date ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({
      name: name.trim(),
      description: description.trim() || null,
      context_id: contextId,
      color: color,
      due_date: dueDate || null,
    } as FormData);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <h2 className="text-base font-semibold text-stone-800">
            {editing ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Launch Timebox MVP, CS7641 Assignment 1…"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project aim to achieve?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 resize-none outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Context</label>
            <ContextSelector value={contextId} onChange={setContextId} placeholder="No context" />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-2">Color</label>
            <ContextColorPicker value={color ?? '#6b7280'} onChange={setColor} />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-stone-500 mb-1.5">
              <Calendar size={11} /> Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {editing ? 'Save' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
