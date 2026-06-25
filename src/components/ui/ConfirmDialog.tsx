export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmStyle = 'bg-red-500 hover:bg-red-600',
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  confirmStyle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal p-6 space-y-4">
        <h2 className="font-semibold text-stone-800">{title}</h2>
        <p className="text-sm text-stone-500">{body}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${confirmStyle} transition-colors shadow-sm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
