import React, { useEffect, useState } from 'react';
import { X, Clock, Calendar, Trash2, Timer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTaskStore } from '../store/useTaskStore';
import { ContextSelector } from './contexts/ContextSelector';
import { ProjectSelector } from './projects/ProjectSelector';
import { TimekeeperButton } from './TimekeeperButton';
import { TimeEntryList } from './TimeEntryList';
import { formatDuration } from '../utils/time';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import type { Task, Priority } from '../types';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'high',   label: 'High',   color: 'text-red-600 bg-red-50 border-red-200' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export function TaskModal() {
  const { isTaskModalOpen, taskModalInitial, closeTaskModal } = useStore();
  const { addTask, updateTask, deleteTask } = useTaskStore();

  const { runningEntry } = useTimekeeperStore();
  const isEdit = !!taskModalInitial?.id;
  const [form, setForm] = useState<Partial<Task>>({});

  useEffect(() => {
    if (isTaskModalOpen) {
      setForm(taskModalInitial ?? {
        title: '', notes: '', estimatedMinutes: 30, priority: 'medium',
        contextId: null, projectId: null, scheduledDate: null, startTime: null, endTime: null,
      });
    }
  }, [isTaskModalOpen, taskModalInitial]);

  if (!isTaskModalOpen) return null;

  function set<K extends keyof Task>(key: K, value: Task[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) return;
    if (isEdit && taskModalInitial?.id) updateTask(taskModalInitial.id, form);
    else addTask(form);
    closeTaskModal();
  }

  function handleDelete() {
    if (isEdit && taskModalInitial?.id) deleteTask(taskModalInitial.id);
    closeTaskModal();
  }

  return (
    /* Outer backdrop — on mobile fills screen, on desktop centers modal */
    <div
      className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/30 backdrop-blur-sm md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeTaskModal(); }}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Modal card — full height on mobile, constrained on desktop */}
      <div className="w-full flex-1 md:flex-none bg-white md:rounded-2xl shadow-modal overflow-hidden md:max-h-[90vh] md:max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-stone-800">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={closeTaskModal}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 md:px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <input
            autoFocus
            type="text"
            placeholder="Task title…"
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            className="w-full text-base font-medium text-stone-800 placeholder-stone-300 border-none outline-none bg-transparent"
          />

          <textarea
            placeholder="Add notes…"
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="w-full text-sm text-stone-600 placeholder-stone-300 border border-stone-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
          />

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('priority', value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${form.priority === value ? color : 'text-stone-400 bg-white border-stone-200 hover:border-stone-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
              <Clock size={12} className="inline mr-1" />Estimated Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => set('estimatedMinutes', mins)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${form.estimatedMinutes === mins ? 'bg-accent-50 border-accent-300 text-accent-700' : 'text-stone-500 bg-white border-stone-200 hover:border-stone-300'}`}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={form.estimatedMinutes ?? 30}
                onChange={(e) => set('estimatedMinutes', Number(e.target.value))}
                className="w-20 px-2 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 text-center outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Project</label>
            <ProjectSelector value={form.projectId ?? null} onChange={(id) => set('projectId', id)} />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Context</label>
            <ContextSelector value={form.contextId ?? null} onChange={(id) => set('contextId', id)} />
          </div>

          {form.scheduledDate && (
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                <Calendar size={12} className="inline mr-1" />Scheduled
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="date"
                  value={form.scheduledDate ?? ''}
                  onChange={(e) => set('scheduledDate', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]"
                />
                {form.startTime && (
                  <>
                    <input type="time" value={form.startTime ?? ''} onChange={(e) => set('startTime', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]" />
                    <span className="text-stone-400 text-sm">→</span>
                    <input type="time" value={form.endTime ?? ''} onChange={(e) => set('endTime', e.target.value)} className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]" />
                  </>
                )}
              </div>
            </div>
          )}

          {isEdit && taskModalInitial?.id && (
            <div className="border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-stone-400" />
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    Time Tracking
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-400">
                  {(taskModalInitial as Task).estimatedMinutes && (
                    <span>Est: {formatDuration((taskModalInitial as Task).estimatedMinutes)}</span>
                  )}
                  {(taskModalInitial as Task).actualMinutes != null && (taskModalInitial as Task).actualMinutes! > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-stone-600 font-medium">
                        Actual: {formatDuration((taskModalInitial as Task).actualMinutes!)}
                      </span>
                      {(taskModalInitial as Task).estimatedMinutes > 0 && (
                        <>
                          <span>·</span>
                          <span className={
                            (taskModalInitial as Task).actualMinutes! > (taskModalInitial as Task).estimatedMinutes
                              ? 'text-red-500' : 'text-emerald-600'
                          }>
                            {(taskModalInitial as Task).actualMinutes! > (taskModalInitial as Task).estimatedMinutes
                              ? `+${formatDuration((taskModalInitial as Task).actualMinutes! - (taskModalInitial as Task).estimatedMinutes)}`
                              : `-${formatDuration((taskModalInitial as Task).estimatedMinutes - (taskModalInitial as Task).actualMinutes!)}`
                            }
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <TimekeeperButton
                  taskId={taskModalInitial.id}
                  taskTitle={taskModalInitial.title ?? ''}
                  size="md"
                />
                <span className="text-xs text-stone-400">
                  {runningEntry?.taskId === taskModalInitial.id
                    ? 'Timer running — click to stop'
                    : 'Start a timer to track time'}
                </span>
              </div>

              <TimeEntryList
                taskId={taskModalInitial.id}
                taskTitle={taskModalInitial.title ?? ''}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors min-h-[44px] px-1">
                <Trash2 size={14} />Delete task
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={closeTaskModal} className="px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors min-h-[44px]">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm min-h-[44px]">
                {isEdit ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
