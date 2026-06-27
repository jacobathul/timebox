import type { DateRange, DatePreset } from '../../lib/analytics/timeAnalytics';
import { format, parseISO } from 'date-fns';

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'This week', value: 'thisWeek' },
  { label: 'This month', value: 'thisMonth' },
];

interface Props {
  dateRange: DateRange;
  onPresetSelect: (preset: DatePreset) => void;
  onCustomRange: (start: string, end: string) => void;
}

function fmtDate(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function AnalyticsDateRangePicker({ dateRange, onPresetSelect, onCustomRange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPresetSelect(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange.preset === p.value
                ? 'bg-accent-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!dateRange.preset && (
        <span className="text-sm text-stone-500 ml-1">
          {fmtDate(dateRange.start)} – {fmtDate(dateRange.end)}
        </span>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <label className="text-xs text-stone-400 mr-1 hidden sm:block">Custom:</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onCustomRange(e.target.value, dateRange.end)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-stone-600 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
        <span className="text-stone-400 text-xs">–</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onCustomRange(dateRange.start, e.target.value)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-stone-600 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
    </div>
  );
}
