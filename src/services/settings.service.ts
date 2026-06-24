import { supabase } from '../lib/supabase';
import type { UserSettings } from '../store/useSettingsStore';
import type { DbUserSettings } from '../types/database';

function dbToSettings(db: DbUserSettings): UserSettings {
  return {
    defaultDayStartTime: db.default_day_start_time ?? '06:00',
    defaultDayEndTime: db.default_day_end_time ?? '23:00',
    theme: (db.theme ?? 'light') as UserSettings['theme'],
  };
}

export const settingsService = {
  async fetch(userId: string): Promise<UserSettings | null> {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data ? dbToSettings(data as DbUserSettings) : null;
  },

  async upsert(userId: string, settings: UserSettings): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          default_day_start_time: settings.defaultDayStartTime,
          default_day_end_time: settings.defaultDayEndTime,
          theme: settings.theme,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    if (error) throw error;
  },
};
