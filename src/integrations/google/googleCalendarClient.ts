import type { GCalEvent, GCalListResponse } from './types';
import type { GoogleCalendarEvent } from '../../types';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function toIso(val: string | undefined, isAllDay: boolean): string {
  if (!val) return new Date().toISOString();
  if (isAllDay) return new Date(val + 'T00:00:00').toISOString();
  return new Date(val).toISOString();
}

export function parseGCalEvent(raw: GCalEvent, calendarName?: string): Omit<GoogleCalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  const isAllDay = !!(raw.start.date && !raw.start.dateTime);
  return {
    provider: 'google_calendar',
    providerEventId: raw.id,
    title: raw.summary ?? '(no title)',
    description: raw.description ?? null,
    location: raw.location ?? null,
    startTime: toIso(raw.start.dateTime ?? raw.start.date, isAllDay),
    endTime: toIso(raw.end.dateTime ?? raw.end.date, isAllDay),
    isAllDay,
    isReadOnly: true,
    sourceCalendarName: calendarName ?? null,
    sourceUrl: raw.htmlLink ?? null,
    calendarId: 'primary',
    attendees: raw.attendees ?? null,
    rawMetadata: raw as unknown as Record<string, unknown>,
  };
}

export async function listCalendarEvents(
  accessToken: string,
  options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
    calendarName?: string;
  } = {},
): Promise<Omit<GoogleCalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]> {
  const calId = options.calendarId ?? 'primary';
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(options.maxResults ?? 50),
    ...(options.timeMin && { timeMin: options.timeMin }),
    ...(options.timeMax && { timeMax: options.timeMax }),
    ...(options.pageToken && { pageToken: options.pageToken }),
  });

  const res = await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calId)}/events?${params}`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
    throw new Error(`Google Calendar API error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as GCalListResponse;
  return (data.items ?? []).map((e) => parseGCalEvent(e, options.calendarName));
}

/** Fetch events for a date range (inclusive). Returns only non-cancelled events. */
export async function fetchEventsForRange(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<Omit<GoogleCalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]> {
  const timeMin = new Date(startDate + 'T00:00:00').toISOString();
  const timeMax = new Date(endDate + 'T23:59:59').toISOString();
  const events = await listCalendarEvents(accessToken, {
    timeMin,
    timeMax,
    maxResults: 100,
    calendarName: 'My Calendar',
  });
  return events;
}
