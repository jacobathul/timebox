const DAYS = [
  { code: 'MO', label: 'Mon' },
  { code: 'TU', label: 'Tue' },
  { code: 'WE', label: 'Wed' },
  { code: 'TH', label: 'Thu' },
  { code: 'FR', label: 'Fri' },
  { code: 'SA', label: 'Sat' },
  { code: 'SU', label: 'Sun' },
] as const;

interface Props {
  value: string[];
  onChange: (days: string[]) => void;
}

export function WeeklyDayPicker({ value, onChange }: Props) {
  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((day) => day !== code) : [...value, code]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day) => {
        const selected = value.includes(day.code);
        return (
          <button
            key={day.code}
            type="button"
            onClick={() => toggle(day.code)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium min-h-[44px] transition-colors ${
              selected
                ? 'border-accent-300 bg-accent-50 text-accent-700'
                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
            }`}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
