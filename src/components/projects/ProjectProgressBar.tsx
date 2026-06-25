interface Props {
  percentage: number;
  color?: string;
  className?: string;
}

export function ProjectProgressBar({ percentage, color = '#3b82f6', className = '' }: Props) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-stone-400">{clamped}% complete</span>
      </div>
      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: clamped === 100 ? '#22c55e' : color }}
        />
      </div>
    </div>
  );
}
