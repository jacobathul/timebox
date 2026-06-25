import { RefreshCw } from 'lucide-react';

export function RecurringTaskBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold text-accent-600">
      <RefreshCw size={10} />
      Recurring
    </span>
  );
}
