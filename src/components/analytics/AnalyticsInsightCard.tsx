import { Lightbulb, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AnalyticsInsight } from '../../lib/analytics/analyticsInsights';

const CONFIG = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconColor: 'text-green-500' },
  tip: { icon: Lightbulb, bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700', iconColor: 'text-stone-500' },
} as const;

export function AnalyticsInsightCard({ insight }: { insight: AnalyticsInsight }) {
  const cfg = CONFIG[insight.type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <p className={`text-sm ${cfg.text}`}>{insight.text}</p>
    </div>
  );
}
