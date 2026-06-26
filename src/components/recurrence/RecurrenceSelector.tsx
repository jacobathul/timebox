import { RecurrenceSummary, type RecurrenceFormState } from './RecurrenceSummary';
import { WeeklyDayPicker } from './WeeklyDayPicker';
import type { RecurrenceFrequency } from '../../types';

interface Props {
  value: RecurrenceFormState;
  onChange: (updates: Partial<RecurrenceFormState>) => void;
}

const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

export function RecurrenceSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="rounded border-stone-300 text-accent-500 focus:ring-accent-200"
        />
        Repeat
      </label>

      {value.enabled && (
        <>
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
              Frequency
            </label>
            <select
              value={value.frequency}
              onChange={(e) => onChange({ frequency: e.target.value as RecurrenceFrequency })}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            >
              {FREQUENCIES.map((frequency) => (
                <option key={frequency.value} value={frequency.value}>
                  {frequency.label}
                </option>
              ))}
            </select>
          </div>

          {value.frequency === 'weekly' && (
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                Days
              </label>
              <WeeklyDayPicker
                value={value.byDay}
                onChange={(days) => onChange({ byDay: days })}
              />
            </div>
          )}

          {value.frequency === 'monthly' && (
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                Day of month
              </label>
              <select
                value={value.byMonthDay}
                onChange={(e) => onChange({ byMonthDay: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                Start date
              </label>
              <input
                type="date"
                value={value.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                End date
              </label>
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                Default time
              </label>
              <input
                type="time"
                value={value.defaultStartTime}
                onChange={(e) => onChange({ defaultStartTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">
                Default duration
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={value.defaultDurationMinutes}
                onChange={(e) => onChange({ defaultDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
              />
            </div>
          </div>

          <RecurrenceSummary value={value} />
        </>
      )}
    </div>
  );
}
