import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X, Info, XCircle } from 'lucide-react';
import type { PlanningWarning } from '../../types';
import { usePlanningWarningsStore } from '../../store/usePlanningWarningsStore';

interface Props {
  warnings: PlanningWarning[];
  title?: string;
  collapsible?: boolean;
  onAction?: (warning: PlanningWarning) => void;
}

const ICON = {
  info: <Info size={14} className="text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
  critical: <XCircle size={14} className="text-red-500 flex-shrink-0" />,
};

const ROW_BG = {
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
  critical: 'bg-red-50 border-red-200',
};

const ROW_TEXT = {
  info: 'text-blue-800',
  warning: 'text-amber-800',
  critical: 'text-red-800',
};

export function PlanningWarningBanner({ warnings, title, collapsible = false, onAction }: Props) {
  const { dismissWarning } = usePlanningWarningsStore();
  const [collapsed, setCollapsed] = useState(false);

  if (warnings.length === 0) return null;

  const criticals = warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  const summaryColor = criticals > 0 ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200';
  const summaryIcon = criticals > 0 ? <XCircle size={14} /> : <AlertTriangle size={14} />;

  return (
    <div className="rounded-xl border overflow-hidden border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium ${summaryColor} border-b border-inherit`}
        onClick={() => collapsible && setCollapsed((c) => !c)}
      >
        {summaryIcon}
        <span className="flex-1 text-left">
          {title ?? `${warnings.length} planning warning${warnings.length !== 1 ? 's' : ''}`}
          {criticals > 0 && <span className="ml-1.5 text-xs font-normal">({criticals} critical)</span>}
          {!criticals && warningCount > 0 && <span className="ml-1.5 text-xs font-normal">({warningCount} warning{warningCount !== 1 ? 's' : ''})</span>}
        </span>
        {collapsible && (collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
      </button>

      {!collapsed && (
        <div className="divide-y divide-stone-100">
          {warnings.map((w) => (
            <div key={w.id} className={`flex items-start gap-2.5 px-3 py-2.5 ${ROW_BG[w.severity]}`}>
              {ICON[w.severity]}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${ROW_TEXT[w.severity]}`}>{w.title}</p>
                <p className={`text-xs mt-0.5 ${ROW_TEXT[w.severity]} opacity-80`}>{w.message}</p>
                {w.actionLabel && w.actionType !== 'dismiss' && onAction && (
                  <button
                    type="button"
                    onClick={() => onAction(w)}
                    className={`mt-1.5 text-xs font-medium underline ${ROW_TEXT[w.severity]} hover:opacity-80 transition-opacity`}
                  >
                    {w.actionLabel} →
                  </button>
                )}
              </div>
              {w.dismissible && (
                <button
                  type="button"
                  onClick={() => dismissWarning(w.id)}
                  className="flex-shrink-0 p-0.5 rounded text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
