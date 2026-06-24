import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import type { ToastType } from '../../store/useToastStore';

const STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
  error:   { bg: 'bg-red-50',     border: 'border-red-200',     icon: <AlertCircle   size={16} className="text-red-500" /> },
  warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <AlertTriangle size={16} className="text-amber-500" /> },
  info:    { bg: 'bg-accent-50',  border: 'border-accent-200',  icon: <Info          size={16} className="text-accent-500" /> },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const s = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-modal ${s.bg} ${s.border} animate-fade-in`}
          >
            <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
            <p className="text-sm text-stone-700 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
