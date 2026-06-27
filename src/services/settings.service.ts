import { supabase } from '../lib/supabase';
import type { UserSettings } from '../store/useSettingsStore';
import type { DbUserSettings } from '../types/database';

function dbToSettings(db: DbUserSettings): UserSettings {
  return {
    defaultDayStartTime: db.default_day_start_time ?? '06:00',
    defaultDayEndTime: db.default_day_end_time ?? '23:00',
    theme: (db.theme ?? 'light') as UserSettings['theme'],
    defaultDailyCapacityMinutes: db.default_daily_capacity_minutes ?? 300,
    workdayStartTime: db.workday_start_time ?? '09:00',
    workdayEndTime: db.workday_end_time ?? '17:00',
    workingDays: db.working_days ?? [1, 2, 3, 4, 5],
    capacityWarningEnabled: db.capacity_warning_enabled ?? true,
    overlapWarningEnabled: db.overlap_warning_enabled ?? true,
    deadlineWarningEnabled: db.deadline_warning_enabled ?? true,
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
          default_daily_capacity_minutes: settings.defaultDailyCapacityMinutes,
          workday_start_time: settings.workdayStartTime,
          workday_end_time: settings.workdayEndTime,
          working_days: settings.workingDays,
          capacity_warning_enabled: settings.capacityWarningEnabled,
          overlap_warning_enabled: settings.overlapWarningEnabled,
          deadline_warning_enabled: settings.deadlineWarningEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    if (error) throw error;
  },
};
