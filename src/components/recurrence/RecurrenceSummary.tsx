import type { RecurrenceFrequency } from '../../types';
import { buildRecurrenceRule, summarizeRecurrenceRule } from '../../utils/recurrence';

export interface RecurrenceFormState {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  byDay: string[];
  byMonthDay: number;
  startDate: string;
  endDate: string;
  defaultStartTime: string;
  defaultDurationMinutes: number;
}

interface Props {
  value: RecurrenceFormState;
}

export function RecurrenceSummary({ value }: Props) {
  if (!value.enabled || value.frequency === 'none') return null;

  const summary = summarizeRecurrenceRule({
    recurrenceRule: buildRecurrenceRule({
      frequency: value.frequency,
      byDay: value.byDay,
      byMonthDay: value.byMonthDay ? [value.byMonthDay] : undefined,
    }),
    startDate: value.startDate,
    endDate: value.endDate || null,
  });

  return <p className="text-xs text-stone-400">{summary}</p>;
}
