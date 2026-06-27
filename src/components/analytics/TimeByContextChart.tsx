import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ContextTimeData } from '../../lib/analytics/timeAnalytics';
import { formatDuration } from '../../utils/time';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: ContextTimeData[];
}

const FALLBACK_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

export function TimeByContextChart({ data }: Props) {
  const visible = data.filter((d) => d.actualMinutes > 0).slice(0, 10);

  if (visible.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Time by Context</h3>
        <AnalyticsEmptyState message="No tracked time by context in this range." />
      </div>
    );
  }

  const chartData = visible.map((d) => ({
    name: d.contextName.length > 20 ? d.contextName.slice(0, 18) + '…' : d.contextName,
    fullName: d.contextName,
    minutes: d.actualMinutes,
    color: d.contextColor ?? FALLBACK_COLORS[0],
    percentage: d.percentage,
  }));

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: typeof chartData[number] }>;
  }

  function CustomTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-card text-sm">
        <p className="font-medium text-stone-700">{item.fullName}</p>
        <p className="text-stone-600">{formatDuration(item.minutes)}</p>
        <p className="text-xs text-stone-400">{item.percentage}% of total</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Time by Context</h3>
      <ResponsiveContainer width="100%" height={Math.max(160, visible.length * 36)}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#78716c' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatDuration(v as number)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11, fill: '#44403c' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={entry.fullName}
                fill={entry.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-1.5 border-t border-stone-100 pt-4">
        {visible.map((item, i) => (
          <div key={item.contextId ?? 'none'} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.contextColor ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
            />
            <span className="flex-1 text-stone-700 truncate">{item.contextName}</span>
            <span className="text-stone-500 text-xs">{formatDuration(item.actualMinutes)}</span>
            <span className="text-stone-400 text-xs w-9 text-right">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
