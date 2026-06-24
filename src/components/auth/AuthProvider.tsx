import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useContextStore } from '../../store/useContextStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const { _setUser, _setSession, _setProfile, _setInitialized, refreshProfile } =
          useAuthStore.getState();

        _setSession(session);
        _setUser(session?.user ?? null);
        _setInitialized();

        if (session?.user) {
          await Promise.all([
            useTaskStore.getState().fetchTasks(),
            useTaskStore.getState().fetchReviews(),
            useContextStore.getState().fetchContexts(),
            useSettingsStore.getState().fetchSettings(),
          ]);
          await refreshProfile();
          _setProfile(useAuthStore.getState().profile);
        } else {
          useTaskStore.getState().clearData();
          useContextStore.getState().clearContexts();
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
