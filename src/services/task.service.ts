import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import type { DbTask } from '../types/database';

function dbToTask(db: DbTask): Task {
  return {
    id: db.id,
    title: db.title,
    notes: db.notes,
    estimatedMinutes: db.estimated_minutes,
    actualMinutes: db.actual_minutes,
    priority: db.priority,
    status: db.status === 'archived' ? 'completed' : db.status,
    contextId: db.context_id ?? db.project_id, // fallback for rows not yet migrated
    scheduledDate: db.scheduled_date,
    startTime: db.start_time,
    endTime: db.end_time,
    completedAt: db.completed_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function taskToInsert(task: Task, userId: string) {
  const insert: Record<string, any> = {
    user_id: userId,
    title: task.title,
    notes: task.notes,
    estimated_minutes: task.estimatedMinutes,
      priority: task.priority,
      status: task.status,
      actual_minutes: null,
      context_id: task.contextId,
      project_id: task.contextId,
      scheduled_date: task.scheduledDate,
      start_time: task.startTime,
      end_time: task.endTime,
      completed_at: task.completedAt,
    };
    
    return insert;
  }

export const taskService = {
  async fetchAll(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as DbTask[]).map(dbToTask);
  },

  async create(task: Task, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert(task, userId))
      .select()
      .single();
    if (error) throw error;
    return dbToTask(data as DbTask);
  },

  async update(id: string, updates: Partial<Task>, userId: string): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined)          patch.title = updates.title;
    if (updates.notes !== undefined)          patch.notes = updates.notes;
    if (updates.estimatedMinutes !== undefined) patch.estimated_minutes = updates.estimatedMinutes;
    if (updates.actualMinutes !== undefined)  patch.actual_minutes = updates.actualMinutes;
    if (updates.priority !== undefined)       patch.priority = updates.priority;
    if (updates.status !== undefined)         patch.status = updates.status;
    if (updates.contextId !== undefined)      { patch.context_id = updates.contextId; patch.project_id = updates.contextId; }
    if (updates.scheduledDate !== undefined)  patch.scheduled_date = updates.scheduledDate;
    if (updates.startTime !== undefined)      patch.start_time = updates.startTime;
    if (updates.endTime !== undefined)        patch.end_time = updates.endTime;
    if (updates.completedAt !== undefined)    patch.completed_at = updates.completedAt;

    const { error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Bulk insert tasks (used for localStorage migration) */
  async bulkCreate(tasks: Task[], userId: string): Promise<void> {
    if (tasks.length === 0) return;
    const rows = tasks.map((t) => taskToInsert(t, userId));
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) throw error;
  },
};
