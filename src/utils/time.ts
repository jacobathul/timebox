import type { Task, OverlapWarning } from '../types';

export const HOUR_HEIGHT_PX = 60; // px per hour in the calendar
export const DAY_START_HOUR = 6;   // 6 AM
export const DAY_END_HOUR = 23;    // 11 PM

/** Convert "HH:MM" to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes from midnight to "HH:MM" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format "HH:MM" to "h:mm AM/PM" */
export function formatTime(time: string): string {
  const mins = timeToMinutes(time);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

/** Format duration in minutes to human-readable "1h 30m" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Given a top offset in pixels and the calendar scroll container's top,
 * snap to the nearest 15-minute slot and return "HH:MM".
 */
export function pixelsToTime(offsetPx: number): string {
  const totalMinutes = (offsetPx / HOUR_HEIGHT_PX) * 60 + DAY_START_HOUR * 60;
  const snapped = Math.round(totalMinutes / 15) * 15;
  return minutesToTime(Math.max(DAY_START_HOUR * 60, Math.min(DAY_END_HOUR * 60 - 15, snapped)));
}

/** Convert "HH:MM" to top-offset px within the calendar */
export function timeToPixels(time: string): number {
  const mins = timeToMinutes(time) - DAY_START_HOUR * 60;
  return (mins / 60) * HOUR_HEIGHT_PX;
}

/** Duration in minutes → height in px */
export function durationToPixels(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT_PX;
}

/** Add minutes to a "HH:MM" string */
export function addMinutes(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  return minutesToTime(Math.min(total, DAY_END_HOUR * 60));
}

/** Check if two scheduled tasks overlap */
export function detectOverlaps(tasks: Task[]): OverlapWarning[] {
  const scheduled = tasks.filter((t) => t.startTime && t.endTime);
  const warnings: OverlapWarning[] = [];

  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];
      if (a.scheduledDate !== b.scheduledDate) continue;
      const aStart = timeToMinutes(a.startTime!);
      const aEnd = timeToMinutes(a.endTime!);
      const bStart = timeToMinutes(b.startTime!);
      const bEnd = timeToMinutes(b.endTime!);
      if (aStart < bEnd && aEnd > bStart) {
        warnings.push({ taskA: a.id, taskB: b.id });
      }
    }
  }
  return warnings;
}

/** Today as "YYYY-MM-DD" */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Offset from today: -1 = yesterday, 1 = tomorrow */
export function dateOffsetStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

/** Get the Monday of the week containing the given date string */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Generate 7 date strings starting from Monday */
export function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const d = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    days.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Format "YYYY-MM-DD" to "Mon, Jun 24" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Format "YYYY-MM-DD" to full e.g. "Tuesday, June 24" */
export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Array of hour labels for the calendar */
export function getHourLabels(): { hour: number; label: string }[] {
  const labels = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    labels.push({ hour: h, label: `${displayH} ${period}` });
  }
  return labels;
}
