import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;

  // Internal setters used by AuthProvider
  _setUser: (user: User | null) => void;
  _setSession: (session: Session | null) => void;
  _setProfile: (profile: UserProfile | null) => void;
  _setInitialized: () => void;

  // Public actions
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Pick<UserProfile, 'displayName' | 'timezone'>>) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  initialized: false,

  _setUser:        (user) => set({ user }),
  _setSession:     (session) => set({ session }),
  _setProfile:     (profile) => set({ profile }),
  _setInitialized: () => set({ initialized: true }),

  login: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) return { error: error.message };
    return { error: null };
  },

  signup: async (email, password) => {
    set({ loading: true });
    const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/reset-password`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    set({ loading: false });
    if (error) {
      // Don't reveal whether an email already exists
      if (error.message.toLowerCase().includes('already registered')) {
        return { error: null, needsConfirmation: true };
      }
      return { error: error.message };
    }
    return { error: null, needsConfirmation: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Never reveal whether the account exists
    if (error) console.error('[auth] resetPassword error:', error.message);
    return { error: null };
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.displayName,
        timezone: data.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) return { error: error.message };
    await get().refreshProfile();
    return { error: null };
  },

  deleteAccount: async () => {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name ?? data.email.split('@')[0],
          timezone: data.timezone ?? 'UTC',
        },
      });
    }
  },
}));
