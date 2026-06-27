import { supabase } from '../lib/supabase';
import type { Task, TaskTimeEntry, AppProject, ProjectContext, WeeklyPlan } from '../types';
import type { DbTimeEntry, DbTask } from '../types/database';

function dbToTimeEntry(row: DbTimeEntry): TaskTimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    entryType: row.entry_type,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? '',
    estimatedMinutes: row.estimated_minutes ?? 0,
    actualMinutes: row.actual_minutes ?? null,
    priority: row.priority ?? 'medium',
    status: (row.status === 'archived' ? 'inbox' : row.status) ?? 'inbox',
    contextId: row.context_id ?? null,
    projectId: row.project_id ?? null,
    scheduledDate: row.scheduled_date ?? null,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    completedAt: row.completed_at ?? null,
    recurringTemplateId: row.recurring_template_id ?? null,
    recurrenceInstanceDate: row.recurrence_instance_date ?? null,
    recurrenceStatus: row.recurrence_status ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceProvider: (row.source_provider as Task['sourceProvider']) ?? null,
    sourceType: (row.source_type as Task['sourceType']) ?? null,
    sourceExternalId: row.source_external_id ?? null,
    sourceUrl: row.source_url ?? null,
    sourceTitle: row.source_title ?? null,
    sourceMetadata: row.source_metadata ?? null,
  };
}

export const analyticsService = {
  async fetchTasksInRange(userId: string, start: string, end: string): Promise<Task[]> {
    // Fetch tasks scheduled in range OR completed in range
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .or(
        `and(scheduled_date.gte.${start},scheduled_date.lte.${end}),and(completed_at.gte.${start}T00:00:00,completed_at.lte.${end}T23:59:59)`,
      );
    if (error) throw error;
    return (data as DbTask[]).map(dbToTask);
  },

  async fetchTimeEntriesInRange(
    userId: string,
    start: string,
    end: string,
  ): Promise<TaskTimeEntry[]> {
    const startIso = new Date(start + 'T00:00:00').toISOString();
    const endIso = new Date(end + 'T23:59:59.999').toISOString();
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startIso)
      .lte('started_at', endIso)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: true });
    if (error) throw error;
    return (data as DbTimeEntry[]).map(dbToTimeEntry);
  },

  async fetchProjects(userId: string): Promise<AppProject[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data as AppProject[];
  },

  async fetchContexts(userId: string): Promise<ProjectContext[]> {
    const { data, error } = await supabase
      .from('contexts')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data as ProjectContext[];
  },

  async fetchWeeklyPlansInRange(
    userId: string,
    start: string,
    end: string,
  ): Promise<WeeklyPlan[]> {
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start_date', start)
      .lte('week_end_date', end);
    if (error) {
      // weekly_plans table may not exist in all environments — fail gracefully
      console.warn('Could not fetch weekly plans:', error.message);
      return [];
    }
    return (data ?? []) as WeeklyPlan[];
  },
};
