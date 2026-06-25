import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { RecurringTaskTemplate, Priority } from '../../types';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ContextSelector } from '../contexts/ContextSelector';
import { ProjectSelector } from '../projects/ProjectSelector';
import { buildRecurrenceRule } from '../../utils/recurrence';
import { RecurrenceSelector } from './RecurrenceSelector';
import type { RecurrenceFormState } from './RecurrenceSummary';
import { todayStr, dateOffsetStr } from '../../utils/time';

interface Props {
  template?: RecurringTaskTemplate | null;
  onClose: () => void;
}

function getInitialState(template?: RecurringTaskTemplate | null): {
  title: string;
  notes: string;
  estimatedMinutes: number;
  priority: Priority;
  contextId: string | null;
  projectId: string | null;
  recurrence: RecurrenceFormState;
} {
  return {
    title: template?.title ?? '',
    notes: template?.notes ?? '',
    estimatedMinutes: template?.estimatedMinutes ?? template?.defaultDurationMinutes ?? 30,
    priority: template?.priority ?? 'medium',
    contextId: template?.contextId ?? null,
    projectId: template?.projectId ?? null,
    recurrence: {
      enabled: true,
      frequency: 'weekly',
      byDay: ['MO'],
      byMonthDay: 1,
      startDate: template?.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: template?.endDate ?? '',
      defaultStartTime: template?.defaultStartTime ?? '',
      defaultDurationMinutes: template?.defaultDurationMinutes ?? 30,
    },
  };
}

export function RecurringTemplateEditorDialog({ template, onClose }: Props) {
  const { createRecurringTemplate, updateRecurringTemplate, refreshFutureInstancesForTemplate } = useRecurringTaskStore();
  const timezone = useAuthStore((s) => s.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  const [form, setForm] = useState(() => getInitialState(template));

  useEffect(() => {
    setForm(getInitialState(template));
  }, [template]);

  function updateRecurrence(updates: Partial<RecurrenceFormState>) {
    setForm((current) => ({ ...current, recurrence: { ...current.recurrence, ...updates } }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const recurrenceRule = buildRecurrenceRule({
      frequency: form.recurrence.frequency,
      byDay: form.recurrence.byDay,
      byMonthDay: [form.recurrence.byMonthDay],
    });

    if (template) {
      await updateRecurringTemplate(template.id, {
        title: form.title,
        notes: form.notes,
        estimatedMinutes: form.estimatedMinutes,
        priority: form.priority,
        contextId: form.contextId,
        projectId: form.projectId,
        recurrenceRule,
        startDate: form.recurrence.startDate,
        endDate: form.recurrence.endDate || null,
        defaultStartTime: form.recurrence.defaultStartTime || null,
        defaultDurationMinutes: form.recurrence.defaultDurationMinutes,
        timezone,
      });
      await refreshFutureInstancesForTemplate(template.id, todayStr(), dateOffsetStr(60));
    } else {
      await createRecurringTemplate({
        title: form.title,
        notes: form.notes,
        estimatedMinutes: form.estimatedMinutes,
        priority: form.priority,
        contextId: form.contextId,
        projectId: form.projectId,
        recurrenceRule,
        startDate: form.recurrence.startDate,
        endDate: form.recurrence.endDate || null,
        defaultStartTime: form.recurrence.defaultStartTime || null,
        defaultDurationMinutes: form.recurrence.defaultDurationMinutes,
        timezone,
        status: 'active',
      });
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-modal overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-800">{template ? 'Edit recurring task' : 'New recurring task'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Project</label>
              <ProjectSelector value={form.projectId} onChange={(projectId) => setForm((current) => ({ ...current, projectId }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Context</label>
              <ContextSelector value={form.contextId} onChange={(contextId) => setForm((current) => ({ ...current, contextId }))} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Estimate (minutes)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.estimatedMinutes}
              onChange={(e) => setForm((current) => ({ ...current, estimatedMinutes: Number(e.target.value) }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            />
          </div>

          <RecurrenceSelector value={form.recurrence} onChange={updateRecurrence} />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors shadow-sm">
              {template ? 'Save changes' : 'Create recurring task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
