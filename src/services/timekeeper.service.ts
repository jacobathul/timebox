import { supabase } from '../lib/supabase';
import type { TaskTimeEntry } from '../types';
import type { DbTimeEntry } from '../types/database';

function dbToEntry(db: DbTimeEntry): TaskTimeEntry {
  return {
    id: db.id,
    userId: db.user_id,
    taskId: db.task_id,
    startedAt: db.started_at,
    endedAt: db.ended_at,
    durationMinutes: db.duration_minutes,
    entryType: db.entry_type,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const timekeeperService = {
  async fetchRunningEntry(userId: string): Promise<TaskTimeEntry | null> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('ended_at', null)
      .eq('entry_type', 'timer')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToEntry(data as DbTimeEntry) : null;
  },

  async fetchForTask(taskId: string, userId: string): Promise<TaskTimeEntry[]> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    if (error) throw error;
    return (data as DbTimeEntry[]).map(dbToEntry);
  },

  async fetchForDate(dateStr: string, userId: string): Promise<TaskTimeEntry[]> {
    // Use local-time start/end of the date to correctly handle timezone offsets
    const dayStart = new Date(dateStr + 'T00:00:00').toISOString();
    const dayEnd = new Date(dateStr + 'T23:59:59.999').toISOString();
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd)
      .order('started_at', { ascending: true });
    if (error) throw error;
    return (data as DbTimeEntry[]).map(dbToEntry);
  },

  async startTimer(taskId: string, userId: string): Promise<TaskTimeEntry> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('task_time_entries')
      .insert({
        user_id: userId,
        task_id: taskId,
        started_at: now,
        ended_at: null,
        entry_type: 'timer',
      })
      .select()
      .single();
    if (error) throw error;
    // Update task's active_time_entry_id and last_started_at
    await supabase
      .from('tasks')
      .update({ active_time_entry_id: (data as DbTimeEntry).id, last_started_at: now })
      .eq('id', taskId)
      .eq('user_id', userId);
    return dbToEntry(data as DbTimeEntry);
  },

  async stopTimer(entryId: string, userId: string): Promise<TaskTimeEntry> {
    const now = new Date().toISOString();
    const { data: existing, error: fetchError } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();
    if (fetchError) throw fetchError;

    const row = existing as DbTimeEntry;
    const startedAt = new Date(row.started_at);
    const endedAt = new Date(now);
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

    const { data, error } = await supabase
      .from('task_time_entries')
      .update({ ended_at: now, duration_minutes: durationMinutes })
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;

    // Clear the task's active_time_entry_id
    await supabase
      .from('tasks')
      .update({ active_time_entry_id: null })
      .eq('active_time_entry_id', entryId)
      .eq('user_id', userId);

    return dbToEntry(data as DbTimeEntry);
  },

  async createManualEntry(
    taskId: string,
    userId: string,
    payload: { startedAt: string; endedAt: string; durationMinutes: number; notes?: string },
  ): Promise<TaskTimeEntry> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .insert({
        user_id: userId,
        task_id: taskId,
        started_at: payload.startedAt,
        ended_at: payload.endedAt,
        duration_minutes: payload.durationMinutes,
        entry_type: 'manual',
        notes: payload.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToEntry(data as DbTimeEntry);
  },

  async updateEntry(
    entryId: string,
    userId: string,
    updates: Partial<{ startedAt: string; endedAt: string; durationMinutes: number; notes: string }>,
  ): Promise<TaskTimeEntry> {
    const patch: Record<string, unknown> = {};
    if (updates.startedAt !== undefined) patch.started_at = updates.startedAt;
    if (updates.endedAt !== undefined) patch.ended_at = updates.endedAt;
    if (updates.durationMinutes !== undefined) patch.duration_minutes = updates.durationMinutes;
    if (updates.notes !== undefined) patch.notes = updates.notes;

    const { data, error } = await supabase
      .from('task_time_entries')
      .update(patch)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return dbToEntry(data as DbTimeEntry);
  },

  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('task_time_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async calculateActualMinutes(taskId: string, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('duration_minutes')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .not('ended_at', 'is', null);
    if (error) throw error;
    return (data as { duration_minutes: number | null }[]).reduce(
      (sum, row) => sum + (row.duration_minutes ?? 0),
      0,
    );
  },
};
