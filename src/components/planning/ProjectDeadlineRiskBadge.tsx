import { AlertTriangle, XCircle } from 'lucide-react';
import type { PlanningWarning } from '../../types';

interface Props {
  warnings: PlanningWarning[];
  onClick?: () => void;
}

export function ProjectDeadlineRiskBadge({ warnings, onClick }: Props) {
  if (warnings.length === 0) return null;

  const hasCritical = warnings.some((w) => w.severity === 'critical');

  if (hasCritical) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold hover:bg-red-100 transition-colors"
      >
        <XCircle size={10} />
        At risk
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-semibold hover:bg-amber-100 transition-colors"
    >
      <AlertTriangle size={10} />
      Capacity risk
    </button>
  );
}
