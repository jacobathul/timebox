import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DayTimeData } from '../../lib/analytics/timeAnalytics';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface Props {
  data: DayTimeData[];
}

function fmtMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const planned = payload.find((p) => p.name === 'Planned')?.value ?? 0;
  const actual = payload.find((p) => p.name === 'Actual')?.value ?? 0;
  const diff = actual - planned;
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-card text-sm">
      <p className="font-medium text-stone-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-sm">
          {p.name}: {fmtMinutes(p.value)}
        </p>
      ))}
      {planned > 0 || actual > 0 ? (
        <p className={`text-xs mt-1 ${diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-stone-500' : 'text-green-600'}`}>
          {diff === 0 ? 'On target' : diff > 0 ? `+${fmtMinutes(diff)} over` : `${fmtMinutes(Math.abs(diff))} under`}
        </p>
      ) : null}
    </div>
  );
}

export function PlannedVsActualChart({ data }: Props) {
  const hasData = data.some((d) => d.plannedMinutes > 0 || d.actualMinutes > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Planned vs Actual Time</h3>
        <AnalyticsEmptyState message="No planned time in this range." />
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), data.length <= 7 ? 'EEE' : 'MMM d'),
    Planned: d.plannedMinutes,
    Actual: d.actualMinutes,
  }));

  const maxVal = Math.max(...data.map((d) => Math.max(d.plannedMinutes, d.actualMinutes)));
  const yMax = Math.ceil(maxVal / 60) * 60 + 60;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Planned vs Actual Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#78716c' }}
            axisLine={false}
            tickLine={false}
            domain={[0, yMax]}
            tickFormatter={(v) => fmtMinutes(v as number)}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Planned" fill="#bae6fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Actual" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
