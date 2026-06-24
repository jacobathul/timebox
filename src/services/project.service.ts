import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import type { DbProject } from '../types/database';

function dbToProject(db: DbProject): Project {
  return { id: db.id, name: db.name, color: db.color };
}

export const projectService = {
  async fetchAll(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as DbProject[]).map(dbToProject);
  },

  async create(project: Project, userId: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({ id: project.id, user_id: userId, name: project.name, color: project.color })
      .select()
      .single();
    if (error) throw error;
    return dbToProject(data as DbProject);
  },

  async update(id: string, updates: Partial<Project>, userId: string): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined)  patch.name = updates.name;
    if (updates.color !== undefined) patch.color = updates.color;
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
