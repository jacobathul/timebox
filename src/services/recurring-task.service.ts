import { supabase } from '../lib/supabase';
import type { RecurringTaskTemplate } from '../types';
import type { DbRecurringTaskTemplate } from '../types/database';

function dbToTemplate(db: DbRecurringTaskTemplate): RecurringTaskTemplate {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    notes: db.notes,
    estimatedMinutes: db.estimated_minutes,
    priority: db.priority,
    contextId: db.context_id,
    projectId: db.project_id,
    recurrenceRule: db.recurrence_rule,
    recurrenceSummary: db.recurrence_summary,
    startDate: db.start_date,
    endDate: db.end_date,
    defaultStartTime: db.default_start_time,
    defaultDurationMinutes: db.default_duration_minutes,
    timezone: db.timezone,
    status: db.status,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    archivedAt: db.archived_at,
  };
}

export const recurringTaskService = {
  async fetchAll(userId: string): Promise<RecurringTaskTemplate[]> {
    const { data, error } = await supabase
      .from('recurring_task_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbRecurringTaskTemplate[]).map(dbToTemplate);
  },

  async create(template: Omit<RecurringTaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>): Promise<RecurringTaskTemplate> {
    const { data, error } = await supabase
      .from('recurring_task_templates')
      .insert({
        user_id: template.userId,
        title: template.title.trim(),
        notes: template.notes,
        estimated_minutes: template.estimatedMinutes,
        priority: template.priority,
        context_id: template.contextId,
        project_id: template.projectId,
        recurrence_rule: template.recurrenceRule,
        recurrence_summary: template.recurrenceSummary,
        start_date: template.startDate,
        end_date: template.endDate,
        default_start_time: template.defaultStartTime,
        default_duration_minutes: template.defaultDurationMinutes,
        timezone: template.timezone,
        status: template.status,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToTemplate(data as DbRecurringTaskTemplate);
  },

  async update(
    id: string,
    updates: Partial<Pick<RecurringTaskTemplate, 'title' | 'notes' | 'estimatedMinutes' | 'priority' | 'contextId' | 'projectId' | 'recurrenceRule' | 'recurrenceSummary' | 'startDate' | 'endDate' | 'defaultStartTime' | 'defaultDurationMinutes' | 'timezone' | 'status' | 'archivedAt'>>,
    userId: string,
  ): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.estimatedMinutes !== undefined) patch.estimated_minutes = updates.estimatedMinutes;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.contextId !== undefined) patch.context_id = updates.contextId;
    if (updates.projectId !== undefined) patch.project_id = updates.projectId;
    if (updates.recurrenceRule !== undefined) patch.recurrence_rule = updates.recurrenceRule;
    if (updates.recurrenceSummary !== undefined) patch.recurrence_summary = updates.recurrenceSummary;
    if (updates.startDate !== undefined) patch.start_date = updates.startDate;
    if (updates.endDate !== undefined) patch.end_date = updates.endDate;
    if (updates.defaultStartTime !== undefined) patch.default_start_time = updates.defaultStartTime;
    if (updates.defaultDurationMinutes !== undefined) patch.default_duration_minutes = updates.defaultDurationMinutes;
    if (updates.timezone !== undefined) patch.timezone = updates.timezone;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.archivedAt !== undefined) patch.archived_at = updates.archivedAt;

    const { error } = await supabase
      .from('recurring_task_templates')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_task_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
