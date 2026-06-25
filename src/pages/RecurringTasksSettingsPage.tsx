import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { RecurringTemplateCard } from '../components/recurrence/RecurringTemplateCard';
import { RecurringTemplateEditorDialog } from '../components/recurrence/RecurringTemplateEditorDialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { RecurringTaskTemplate } from '../types';
import { todayStr } from '../utils/time';

export function RecurringTasksSettingsPage() {
  const {
    templates,
    fetchRecurringTemplates,
    pauseRecurringTemplate,
    resumeRecurringTemplate,
    archiveRecurringTemplate,
    deleteFutureInstancesForTemplate,
  } = useRecurringTaskStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTaskTemplate | null>(null);
  const [deleting, setDeleting] = useState<RecurringTaskTemplate | null>(null);

  useEffect(() => {
    fetchRecurringTemplates();
  }, [fetchRecurringTemplates]);

  const active = templates.filter((template) => template.status === 'active');
  const paused = templates.filter((template) => template.status === 'paused');
  const archived = templates.filter((template) => template.status === 'archived');

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Recurring Tasks</h1>
          <p className="text-sm text-stone-400 mt-1">Manage repeating task templates and their generated instances.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setEditorOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors shadow-sm"
        >
          <Plus size={14} />
          New recurring task
        </button>
      </div>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Active</h2>
          <div className="space-y-3">
            {active.map((template) => (
              <RecurringTemplateCard
                key={template.id}
                template={template}
                onEdit={() => { setEditing(template); setEditorOpen(true); }}
                onPause={() => pauseRecurringTemplate(template.id)}
                onResume={() => resumeRecurringTemplate(template.id)}
                onArchive={() => archiveRecurringTemplate(template.id)}
                onDelete={() => setDeleting(template)}
              />
            ))}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Paused</h2>
          <div className="space-y-3">
            {paused.map((template) => (
              <RecurringTemplateCard
                key={template.id}
                template={template}
                onEdit={() => { setEditing(template); setEditorOpen(true); }}
                onPause={() => pauseRecurringTemplate(template.id)}
                onResume={() => resumeRecurringTemplate(template.id)}
                onArchive={() => archiveRecurringTemplate(template.id)}
                onDelete={() => setDeleting(template)}
              />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Archived</h2>
          <div className="space-y-3 opacity-80">
            {archived.map((template) => (
              <RecurringTemplateCard
                key={template.id}
                template={template}
                onEdit={() => { setEditing(template); setEditorOpen(true); }}
                onPause={() => pauseRecurringTemplate(template.id)}
                onResume={() => resumeRecurringTemplate(template.id)}
                onArchive={() => archiveRecurringTemplate(template.id)}
                onDelete={() => setDeleting(template)}
              />
            ))}
          </div>
        </section>
      )}

      {templates.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-14 text-center">
          <p className="text-sm font-medium text-stone-500">No recurring tasks yet</p>
          <p className="mt-1 text-xs text-stone-400">Create a task template and generate future occurrences on demand.</p>
        </div>
      )}

      {editorOpen && (
        <RecurringTemplateEditorDialog
          template={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete recurring series?"
          body="This will archive the template and remove future incomplete generated tasks."
          confirmLabel="Delete series"
          confirmStyle="bg-red-500 hover:bg-red-600"
          onConfirm={async () => {
            await archiveRecurringTemplate(deleting.id);
            await deleteFutureInstancesForTemplate(deleting.id, todayStr());
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
