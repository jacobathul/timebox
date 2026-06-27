import type { PlanningWarningSeverity } from '../../types';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface Props {
  severity: PlanningWarningSeverity;
  className?: string;
}

const CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Info' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Warning' },
  critical: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Critical' },
};

export function WarningSeverityBadge({ severity, className = '' }: Props) {
  const { icon: Icon, bg, border, text, label } = CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${bg} ${border} ${text} ${className}`}>
      <Icon size={9} />
      {label}
    </span>
  );
}
