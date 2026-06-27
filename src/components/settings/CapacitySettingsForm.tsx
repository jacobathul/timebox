import { useSettingsStore } from '../../store/useSettingsStore';

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const CAPACITY_PRESETS = [
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
  { label: '5h', value: 300 },
  { label: '6h', value: 360 },
  { label: '8h', value: 480 },
];

export function CapacitySettingsForm() {
  const { settings, updateSettings } = useSettingsStore();

  function toggleWorkingDay(day: number) {
    const days = settings.workingDays.includes(day)
      ? settings.workingDays.filter((d) => d !== day)
      : [...settings.workingDays, day].sort((a, b) => a - b);
    void updateSettings({ workingDays: days });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Planning &amp; Capacity</h3>

        {/* Daily capacity */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block">
            Default daily capacity
          </label>
          <div className="flex flex-wrap gap-2">
            {CAPACITY_PRESETS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => void updateSettings({ defaultDailyCapacityMinutes: value })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${
                  settings.defaultDailyCapacityMinutes === value
                    ? 'bg-accent-50 border-accent-300 text-accent-700'
                    : 'text-stone-500 bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                {label}
              </button>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={30}
                max={960}
                step={15}
                value={settings.defaultDailyCapacityMinutes}
                onChange={(e) => void updateSettings({ defaultDailyCapacityMinutes: Number(e.target.value) })}
                className="w-20 px-2 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 text-center outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]"
              />
              <span className="text-xs text-stone-400">min</span>
            </div>
          </div>
        </div>

        {/* Working hours */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block">
            Working hours
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.workdayStartTime}
                onChange={(e) => void updateSettings({ workdayStartTime: e.target.value })}
                className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]"
              />
              <span className="text-stone-400 text-sm">to</span>
              <input
                type="time"
                value={settings.workdayEndTime}
                onChange={(e) => void updateSettings({ workdayEndTime: e.target.value })}
                className="px-3 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Working days */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block">
            Working days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map(({ value, label }) => {
              const active = settings.workingDays.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleWorkingDay(value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-[44px] min-w-[48px] ${
                    active
                      ? 'bg-accent-50 border-accent-300 text-accent-700'
                      : 'text-stone-400 bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning toggles */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block">
            Warning settings
          </label>
          <div className="space-y-2">
            {[
              { key: 'capacityWarningEnabled' as const, label: 'Capacity warnings', desc: 'Warn when planned work exceeds daily capacity' },
              { key: 'overlapWarningEnabled' as const, label: 'Overlap warnings', desc: 'Warn when tasks or calendar events overlap' },
              { key: 'deadlineWarningEnabled' as const, label: 'Deadline warnings', desc: 'Warn when project work exceeds capacity before deadline' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-stone-300 transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => void updateSettings({ [key]: e.target.checked })}
                  className="mt-0.5 rounded border-stone-300 text-accent-500 focus:ring-accent-400"
                />
                <div>
                  <p className="text-sm font-medium text-stone-700">{label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
