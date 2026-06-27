import { Timer, CheckSquare, BarChart2 } from 'lucide-react';

interface Props {
  message: string;
  icon?: 'timer' | 'check' | 'chart';
}

export function AnalyticsEmptyState({ message, icon = 'chart' }: Props) {
  const Icon = icon === 'timer' ? Timer : icon === 'check' ? CheckSquare : BarChart2;
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon size={32} className="text-stone-300 mb-3" />
      <p className="text-sm text-stone-400 max-w-xs">{message}</p>
    </div>
  );
}
