interface Props {
  plannedMinutes: number;
  capacityMinutes: number;
  className?: string;
  showLabel?: boolean;
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function DailyCapacityBar({ plannedMinutes, capacityMinutes, className = '', showLabel = true }: Props) {
  const pct = capacityMinutes > 0 ? Math.min((plannedMinutes / capacityMinutes) * 100, 100) : 0;
  const overloaded = plannedMinutes > capacityMinutes;
  const critical = plannedMinutes > capacityMinutes * 1.2;

  const barColor = critical
    ? 'bg-red-400'
    : overloaded
    ? 'bg-amber-400'
    : 'bg-accent-400';

  const textColor = critical
    ? 'text-red-600'
    : overloaded
    ? 'text-amber-600'
    : 'text-stone-500';

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-400">Planned</span>
          <span className={`font-medium ${textColor}`}>
            {formatMins(plannedMinutes)} / {formatMins(capacityMinutes)}
            {overloaded && <span className="ml-1">·  {formatMins(plannedMinutes - capacityMinutes)} over</span>}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
