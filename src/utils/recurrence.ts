import type { RecurrenceFrequency, RecurringTaskTemplate } from '../types';

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isLastDayOfMonth(date: Date): boolean {
  const next = addDays(date, 1);
  return next.getUTCDate() === 1;
}

function ordinal(day: number): string {
  if (day === 1) return '1st';
  if (day === 2) return '2nd';
  if (day === 3) return '3rd';
  return `${day}th`;
}

export interface ParsedRecurrenceRule {
  freq: RecurrenceFrequency;
  byDay: string[];
  byMonthDay: number[];
}

export function parseRecurrenceRule(rule: string): ParsedRecurrenceRule {
  const parts = Object.fromEntries(
    rule.split(';').map((part) => {
      const [key, value] = part.split('=');
      return [key, value ?? ''];
    }),
  );

  const freqRaw = (parts.FREQ ?? 'NONE').toLowerCase();
  const allowed = ['daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom'] as const;
  const freq = allowed.includes(freqRaw as typeof allowed[number])
    ? (freqRaw as Exclude<RecurrenceFrequency, 'none'>)
    : 'none';
  const byDay = (parts.BYDAY ?? '').split(',').filter(Boolean);
  const byMonthDay = (parts.BYMONTHDAY ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  return { freq, byDay, byMonthDay };
}

export function buildRecurrenceRule(input: {
  frequency: RecurrenceFrequency;
  byDay?: string[];
  byMonthDay?: number[];
}): string {
  switch (input.frequency) {
    case 'daily':
      return 'FREQ=DAILY';
    case 'weekdays':
      return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    case 'weekly':
      return `FREQ=WEEKLY;BYDAY=${(input.byDay ?? ['MO']).join(',')}`;
    case 'monthly':
      return `FREQ=MONTHLY;BYMONTHDAY=${(input.byMonthDay ?? [1]).join(',')}`;
    case 'yearly':
      return 'FREQ=YEARLY';
    case 'custom':
      return 'FREQ=CUSTOM';
    case 'none':
    default:
      return 'FREQ=NONE';
  }
}

export function summarizeRecurrenceRule(template: Pick<RecurringTaskTemplate, 'recurrenceRule' | 'startDate' | 'endDate'>): string {
  const { freq, byDay, byMonthDay } = parseRecurrenceRule(template.recurrenceRule);
  let summary = '';

  if (freq === 'daily') summary = 'Repeats daily';
  else if (freq === 'weekdays') summary = 'Repeats every weekday';
  else if (freq === 'weekly') {
    const days = byDay.length > 0
      ? byDay.map((day) => WEEKDAY_LABELS[WEEKDAY_CODES.indexOf(day as typeof WEEKDAY_CODES[number])]).filter(Boolean)
      : ['Monday'];
    summary = `Repeats every ${days.join(', ')}`;
  } else if (freq === 'monthly') {
    const day = byMonthDay[0] ?? new Date(template.startDate + 'T00:00:00').getUTCDate();
    summary = day === -1 ? 'Repeats monthly on the last day' : `Repeats monthly on the ${ordinal(day)}`;
  } else if (freq === 'yearly') {
    summary = 'Repeats yearly';
  } else if (freq === 'custom') {
    summary = 'Custom recurrence';
  } else {
    summary = 'Does not repeat';
  }

  if (template.endDate) {
    const date = new Date(template.endDate + 'T00:00:00');
    summary += ` until ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }

  return summary;
}

function matchesWeekly(date: Date, byDay: string[]): boolean {
  const weekday = WEEKDAY_CODES[date.getUTCDay()];
  return byDay.length === 0 ? weekday === 'MO' : byDay.includes(weekday);
}

function matchesMonthly(date: Date, byMonthDay: number[]): boolean {
  if (byMonthDay.includes(-1)) return isLastDayOfMonth(date);
  return byMonthDay.length === 0 ? date.getUTCDate() === 1 : byMonthDay.includes(date.getUTCDate());
}

export function generateRecurrenceDates(
  template: Pick<RecurringTaskTemplate, 'startDate' | 'endDate' | 'recurrenceRule'>,
  throughDate: string,
  fromDate?: string,
): string[] {
  const { freq, byDay, byMonthDay } = parseRecurrenceRule(template.recurrenceRule);
  if (freq === 'none' || freq === 'custom') return [];

  const start = parseDate(fromDate ?? template.startDate);
  const through = parseDate(throughDate);
  const limit = template.endDate ? parseDate(template.endDate) : through;
  const end = limit < through ? limit : through;

  const result: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    let ok = false;
    if (freq === 'daily') ok = true;
    else if (freq === 'weekdays') ok = cursor.getUTCDay() >= 1 && cursor.getUTCDay() <= 5;
    else if (freq === 'weekly') ok = matchesWeekly(cursor, byDay);
    else if (freq === 'monthly') ok = matchesMonthly(cursor, byMonthDay);
    else if (freq === 'yearly') {
      const startDate = parseDate(template.startDate);
      ok = cursor.getUTCMonth() === startDate.getUTCMonth() && cursor.getUTCDate() === startDate.getUTCDate();
    }
    if (ok && cursor >= parseDate(template.startDate)) result.push(formatDate(cursor));
  }
  return result;
}

export function getNextOccurrenceDate(
  template: Pick<RecurringTaskTemplate, 'startDate' | 'endDate' | 'recurrenceRule'>,
  fromDate: string,
): string | null {
  const dates = generateRecurrenceDates(template, template.endDate ?? addDays(parseDate(fromDate), 366).toISOString().slice(0, 10), fromDate);
  return dates[0] ?? null;
}
