import { AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { PlanningWarning } from '../../types';
import { usePlanningWarningsStore } from '../../store/usePlanningWarningsStore';

interface Props {
  warning: PlanningWarning;
  onAction?: (warning: PlanningWarning) => void;
}

const CONFIG = {
  info: { Icon: Info, container: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  warning: { Icon: AlertTriangle, container: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  critical: { Icon: XCircle, container: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export function PlanningWarningInline({ warning, onAction }: Props) {
  const { dismissWarning, dismissedWarningIds } = usePlanningWarningsStore();

  if (dismissedWarningIds.includes(warning.id)) return null;

  const { Icon, container, text } = CONFIG[warning.severity];

  return (
    <div className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border ${container}`}>
      <Icon size={13} className={`flex-shrink-0 mt-0.5 ${text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${text}`}>{warning.message}</p>
        {warning.actionLabel && warning.actionType !== 'dismiss' && onAction && (
          <button
            type="button"
            onClick={() => onAction(warning)}
            className={`mt-1 text-xs font-medium underline ${text} hover:opacity-80 transition-opacity`}
          >
            {warning.actionLabel}
          </button>
        )}
      </div>
      {warning.dismissible && (
        <button
          type="button"
          onClick={() => dismissWarning(warning.id)}
          className={`flex-shrink-0 ${text} opacity-60 hover:opacity-100 transition-opacity`}
          aria-label="Dismiss"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
