import { CalendarDays, Pause, Play, Archive, Trash2, Pencil } from 'lucide-react';
import type { RecurringTaskTemplate } from '../../types';
import { formatDate } from '../../utils/time';
import { getRecurringNextOccurrence } from '../../store/useRecurringTaskStore';
import { RecurringTaskBadge } from './RecurringTaskBadge';

interface Props {
  template: RecurringTaskTemplate;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function RecurringTemplateCard({ template, onEdit, onPause, onResume, onArchive, onDelete }: Props) {
  const nextOccurrence = getRecurringNextOccurrence(template);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-stone-800 truncate">{template.title}</h3>
            <RecurringTaskBadge />
          </div>
          <p className="mt-1 text-xs text-stone-400">
            {template.recurrenceSummary ?? 'Recurring task'}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          {template.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-400">
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={12} />
          Start {formatDate(template.startDate)}
        </span>
        {template.endDate && <span>End {formatDate(template.endDate)}</span>}
        {nextOccurrence && <span>Next {formatDate(nextOccurrence)}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
          <Pencil size={12} /> Edit
        </button>
        {template.status === 'active' ? (
          <button onClick={onPause} className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            <Pause size={12} /> Pause
          </button>
        ) : (
          <button onClick={onResume} className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            <Play size={12} /> Resume
          </button>
        )}
        <button onClick={onArchive} className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
          <Archive size={12} /> Archive
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}
