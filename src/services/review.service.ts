import { supabase } from '../lib/supabase';
import type { DailyReview } from '../types';
import type { DbDailyReview } from '../types/database';

function dbToReview(db: DbDailyReview): DailyReview {
  return {
    date: db.review_date,
    reflection: db.reflection,
    plannedMinutes: db.planned_minutes,
    completedMinutes: db.completed_minutes,
    completedTaskIds: db.completed_task_ids,
    unfinishedTaskIds: db.unfinished_task_ids,
  };
}

export const reviewService = {
  async fetchAll(userId: string): Promise<DailyReview[]> {
    const { data, error } = await supabase
      .from('daily_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('review_date', { ascending: false });
    if (error) throw error;
    return (data as DbDailyReview[]).map(dbToReview);
  },

  async save(review: DailyReview, userId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_reviews')
      .upsert(
        {
          user_id: userId,
          review_date: review.date,
          reflection: review.reflection,
          planned_minutes: review.plannedMinutes,
          completed_minutes: review.completedMinutes,
          completed_task_ids: review.completedTaskIds,
          unfinished_task_ids: review.unfinishedTaskIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,review_date' },
      );
    if (error) throw error;
  },
};
