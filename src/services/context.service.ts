import { supabase } from '../lib/supabase';
import type { ProjectContext } from '../types';
import type { DbContext } from '../types/database';

function dbToContext(db: DbContext): ProjectContext {
  return {
    id: db.id,
    user_id: db.user_id,
    parent_context_id: db.parent_context_id,
    name: db.name,
    color: db.color,
    depth: db.depth,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

export const contextService = {
  async fetchAll(userId: string): Promise<ProjectContext[]> {
    const { data, error } = await supabase
      .from('contexts')
      .select('*')
      .eq('user_id', userId)
      .order('depth', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as DbContext[]).map(dbToContext);
  },

  async create(ctx: Omit<ProjectContext, 'created_at' | 'updated_at'>): Promise<ProjectContext> {
    const { data, error } = await supabase
      .from('contexts')
      .insert({
        id: ctx.id,
        user_id: ctx.user_id,
        parent_context_id: ctx.parent_context_id,
        name: ctx.name.trim(),
        color: ctx.color,
        depth: ctx.depth,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToContext(data as DbContext);
  },

  async update(id: string, updates: Partial<Pick<ProjectContext, 'name' | 'color'>>, userId: string): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.color !== undefined) patch.color = updates.color;
    const { error } = await supabase
      .from('contexts')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('contexts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
