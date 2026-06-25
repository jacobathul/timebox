import { supabase } from '../lib/supabase';
import type { AppProject, ProjectStatus } from '../types';
import type { DbProject } from '../types/database';

function dbToProject(db: DbProject): AppProject {
  return {
    id: db.id,
    user_id: db.user_id,
    context_id: db.context_id,
    name: db.name,
    description: db.description,
    color: db.color,
    due_date: db.due_date,
    status: db.status as ProjectStatus,
    completed_at: db.completed_at,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

export const projectService = {
  async fetchAll(userId: string): Promise<AppProject[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbProject[]).map(dbToProject);
  },

  async create(project: Omit<AppProject, 'id' | 'created_at' | 'updated_at'>): Promise<AppProject> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: project.user_id,
        context_id: project.context_id,
        name: project.name.trim(),
        description: project.description?.trim() ?? null,
        color: project.color,
        due_date: project.due_date,
        status: project.status,
        completed_at: project.completed_at,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToProject(data as DbProject);
  },

  async update(
    id: string,
    updates: Partial<Pick<AppProject, 'name' | 'description' | 'color' | 'due_date' | 'status' | 'context_id' | 'completed_at'>>,
    userId: string,
  ): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined)         patch.name = updates.name.trim();
    if (updates.description !== undefined)  patch.description = updates.description?.trim() ?? null;
    if (updates.color !== undefined)        patch.color = updates.color;
    if (updates.due_date !== undefined)     patch.due_date = updates.due_date;
    if (updates.status !== undefined)       patch.status = updates.status;
    if (updates.context_id !== undefined)   patch.context_id = updates.context_id;
    if (updates.completed_at !== undefined) patch.completed_at = updates.completed_at;

    const { error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
