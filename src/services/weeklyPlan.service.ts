import { supabase } from '../lib/supabase';
import type { WeeklyPlan } from '../types';
import type { DbWeeklyPlan } from '../types/database';

function dbToWeeklyPlan(db: DbWeeklyPlan): WeeklyPlan {
  return {
    id: db.id,
    user_id: db.user_id,
    week_start_date: db.week_start_date,
    week_end_date: db.week_end_date,
    status: db.status,
    reflection_last_week: db.reflection_last_week,
    weekly_intention: db.weekly_intention,
    weekly_capacity_minutes: db.weekly_capacity_minutes,
    planned_minutes: db.planned_minutes,
    completed_minutes: db.completed_minutes,
    selected_project_ids: db.selected_project_ids ?? [],
    selected_context_ids: db.selected_context_ids ?? [],
    priority_items: db.priority_items ?? [],
    day_plans: db.day_plans ?? {},
    created_at: db.created_at,
    updated_at: db.updated_at,
    completed_at: db.completed_at,
  };
}

function toPatch(plan: Partial<WeeklyPlan> & { weekly_review_reflection?: string | null }) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (plan.week_start_date !== undefined) patch.week_start_date = plan.week_start_date;
  if (plan.week_end_date !== undefined) patch.week_end_date = plan.week_end_date;
  if (plan.status !== undefined) patch.status = plan.status;
  if (plan.reflection_last_week !== undefined) patch.reflection_last_week = plan.reflection_last_week;
  if (plan.weekly_intention !== undefined) patch.weekly_intention = plan.weekly_intention;
  if (plan.weekly_capacity_minutes !== undefined) patch.weekly_capacity_minutes = plan.weekly_capacity_minutes;
  if (plan.planned_minutes !== undefined) patch.planned_minutes = plan.planned_minutes;
  if (plan.completed_minutes !== undefined) patch.completed_minutes = plan.completed_minutes;
  if (plan.selected_project_ids !== undefined) patch.selected_project_ids = plan.selected_project_ids;
  if (plan.selected_context_ids !== undefined) patch.selected_context_ids = plan.selected_context_ids;
  if (plan.priority_items !== undefined) patch.priority_items = plan.priority_items;
  if (plan.day_plans !== undefined) patch.day_plans = plan.day_plans;
  if (plan.completed_at !== undefined) patch.completed_at = plan.completed_at;
  if (plan.weekly_review_reflection !== undefined) patch.weekly_review_reflection = plan.weekly_review_reflection;
  return patch;
}

export type WeeklyPlanUpsertInput = Omit<WeeklyPlan, 'id' | 'created_at' | 'updated_at' | 'completed_at'> & {
  completed_at?: string | null;
  weekly_review_reflection?: string | null;
};

export const weeklyPlanService = {
  async fetchForWeek(userId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToWeeklyPlan(data as DbWeeklyPlan) : null;
  },

  async create(plan: WeeklyPlanUpsertInput, userId: string): Promise<WeeklyPlan> {
    const { data, error } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: userId,
        week_start_date: plan.week_start_date,
        week_end_date: plan.week_end_date,
        status: plan.status,
        reflection_last_week: plan.reflection_last_week,
        weekly_intention: plan.weekly_intention,
        weekly_capacity_minutes: plan.weekly_capacity_minutes,
        planned_minutes: plan.planned_minutes,
        completed_minutes: plan.completed_minutes,
        selected_project_ids: plan.selected_project_ids,
        selected_context_ids: plan.selected_context_ids,
        priority_items: plan.priority_items,
        day_plans: plan.day_plans,
        completed_at: plan.completed_at ?? null,
        weekly_review_reflection: plan.weekly_review_reflection ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToWeeklyPlan(data as DbWeeklyPlan);
  },

  async upsertForWeek(plan: WeeklyPlanUpsertInput, userId: string): Promise<WeeklyPlan> {
    const { data, error } = await supabase
      .from('weekly_plans')
      .upsert(
        {
          user_id: userId,
          week_start_date: plan.week_start_date,
          week_end_date: plan.week_end_date,
          status: plan.status,
          reflection_last_week: plan.reflection_last_week,
          weekly_intention: plan.weekly_intention,
          weekly_capacity_minutes: plan.weekly_capacity_minutes,
          planned_minutes: plan.planned_minutes,
          completed_minutes: plan.completed_minutes,
          selected_project_ids: plan.selected_project_ids,
          selected_context_ids: plan.selected_context_ids,
          priority_items: plan.priority_items,
          day_plans: plan.day_plans,
          completed_at: plan.completed_at ?? null,
          weekly_review_reflection: plan.weekly_review_reflection ?? null,
        },
        { onConflict: 'user_id,week_start_date' },
      )
      .select()
      .single();
    if (error) throw error;
    return dbToWeeklyPlan(data as DbWeeklyPlan);
  },

  async update(id: string, updates: Partial<WeeklyPlan> & { weekly_review_reflection?: string | null }, userId: string): Promise<WeeklyPlan> {
    const { data, error } = await supabase
      .from('weekly_plans')
      .update(toPatch(updates))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return dbToWeeklyPlan(data as DbWeeklyPlan);
  },

  async archive(id: string, userId: string): Promise<WeeklyPlan> {
    return weeklyPlanService.update(id, { status: 'archived' }, userId);
  },

  async complete(
    id: string,
    userId: string,
    payload: { completedMinutes?: number | null; reflection?: string | null },
  ): Promise<WeeklyPlan> {
    const updates: Partial<WeeklyPlan> & { weekly_review_reflection?: string | null } = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_minutes: payload.completedMinutes ?? undefined,
      weekly_review_reflection: payload.reflection ?? null,
    };
    return this.update(id, updates, userId);
  },
};
