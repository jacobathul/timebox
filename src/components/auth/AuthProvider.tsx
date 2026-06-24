import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';

/**
 * Subscribes to Supabase auth state changes and keeps the store in sync.
 * Must be rendered once near the top of the component tree.
 */
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
          // Fetch cloud data (replaces local/demo data)
          await Promise.all([
            useTaskStore.getState().fetchTasks(),
            useTaskStore.getState().fetchReviews(),
            useProjectStore.getState().fetchProjects(),
            useSettingsStore.getState().fetchSettings(),
          ]);
          await refreshProfile();
          _setProfile(useAuthStore.getState().profile);
        } else {
          // Clear cloud data; local/demo data remains in Zustand
          useTaskStore.getState().clearData();
          useProjectStore.getState().clearProjects();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
