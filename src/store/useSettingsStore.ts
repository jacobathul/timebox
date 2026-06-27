import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { settingsService } from '../services/settings.service';

export interface UserSettings {
  defaultDayStartTime: string;
  defaultDayEndTime: string;
  theme: 'light' | 'dark' | 'system';
  defaultDailyCapacityMinutes: number;
  workdayStartTime: string;
  workdayEndTime: string;
  workingDays: number[];
  capacityWarningEnabled: boolean;
  overlapWarningEnabled: boolean;
  deadlineWarningEnabled: boolean;
}

export const SETTINGS_DEFAULTS: UserSettings = {
  defaultDayStartTime: '06:00',
  defaultDayEndTime: '23:00',
  theme: 'light',
  defaultDailyCapacityMinutes: 300,
  workdayStartTime: '09:00',
  workdayEndTime: '17:00',
  workingDays: [1, 2, 3, 4, 5],
  capacityWarningEnabled: true,
  overlapWarningEnabled: true,
  deadlineWarningEnabled: true,
};

interface SettingsState {
  settings: UserSettings;
  loading: boolean;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: SETTINGS_DEFAULTS,
  loading: false,

  fetchSettings: async () => {
    const uid = useAuthStore.getState().user?.id;
    if (!uid) return;
    set({ loading: true });
    try {
      const data = await settingsService.fetch(uid);
      set({ settings: data ?? SETTINGS_DEFAULTS });
    } catch { /* silent fallback to defaults */ }
    finally { set({ loading: false }); }
  },

  updateSettings: async (updates) => {
    const merged = { ...get().settings, ...updates };
    set({ settings: merged });
    const uid = useAuthStore.getState().user?.id;
    if (uid) {
      await settingsService.upsert(uid, merged).catch(() => {
        set({ settings: get().settings }); // rollback
      });
    }
  },
}));
