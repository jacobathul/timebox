interface Props {
  mode: 'edit' | 'delete';
  taskTitle: string;
  onThisOnly: () => void;
  onEntireSeries: () => void;
  onCancel: () => void;
}

export function RecurringTaskScopeDialog({ mode, taskTitle, onThisOnly, onEntireSeries, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-modal space-y-4">
        <div>
          <h2 className="font-semibold text-stone-800">This task is part of a recurring series. What do you want to {mode}?</h2>
          <p className="mt-2 text-sm text-stone-500">"{taskTitle}" was generated from a recurring template.</p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onThisOnly}
            className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            This task only
          </button>
          <button
            type="button"
            onClick={onEntireSeries}
            className="w-full rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-900 transition-colors"
          >
            Entire series
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
