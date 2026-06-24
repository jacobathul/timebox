import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // picks up magic-link & reset-password tokens from URL hash
    },
  },
);
