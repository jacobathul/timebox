import { supabase } from '../lib/supabase';
import type { GoogleCalendarEvent } from '../types';
import type { DbCalendarEvent } from '../types/database';

function dbToEvent(db: DbCalendarEvent): GoogleCalendarEvent {
  return {
    id: db.id,
    userId: db.user_id,
    provider: 'google_calendar',
    providerEventId: db.provider_event_id ?? '',
    title: db.title,
    description: db.description,
    location: db.location,
    startTime: db.start_time,
    endTime: db.end_time,
    isAllDay: db.is_all_day,
    isReadOnly: db.is_read_only,
    sourceCalendarName: db.source_calendar_name,
    sourceUrl: db.source_url,
    calendarId: db.calendar_id,
    attendees: db.attendees ?? null,
    rawMetadata: db.raw_metadata,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const googleCalendarCacheService = {
  async fetchForRange(userId: string, startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    const timeMin = new Date(startDate + 'T00:00:00').toISOString();
    const timeMax = new Date(endDate + 'T23:59:59').toISOString();

    const { data, error } = await supabase
      .from('calendar_events_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .gte('start_time', timeMin)
      .lte('start_time', timeMax)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data as DbCalendarEvent[]).map(dbToEvent);
  },

  async upsertEvents(
    userId: string,
    events: Omit<GoogleCalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[],
  ): Promise<void> {
    if (events.length === 0) return;

    const rows = events.map((e) => ({
      user_id:              userId,
      provider:             'google_calendar',
      provider_event_id:    e.providerEventId,
      title:                e.title,
      description:          e.description,
      location:             e.location,
      start_time:           e.startTime,
      end_time:             e.endTime,
      is_all_day:           e.isAllDay,
      is_read_only:         true,
      source_calendar_name: e.sourceCalendarName,
      source_url:           e.sourceUrl,
      calendar_id:          e.calendarId,
      attendees:            e.attendees,
      raw_metadata:         e.rawMetadata,
      updated_at:           new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('calendar_events_cache')
      .upsert(rows, { onConflict: 'user_id,provider,provider_event_id' });
    if (error) throw error;
  },

  async deleteRange(userId: string, startDate: string, endDate: string): Promise<void> {
    const timeMin = new Date(startDate + 'T00:00:00').toISOString();
    const timeMax = new Date(endDate + 'T23:59:59').toISOString();

    const { error } = await supabase
      .from('calendar_events_cache')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .gte('start_time', timeMin)
      .lte('start_time', timeMax);
    if (error) throw error;
  },
};
