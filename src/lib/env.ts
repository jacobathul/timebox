const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'] as const;

function getEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  return value ?? '';
}

export const env = {
  supabaseUrl:  getEnv('VITE_SUPABASE_URL'),
  supabaseKey:  getEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  appBaseUrl:   getEnv('VITE_APP_BASE_URL') || 'http://localhost:5173',
};

export function getMissingEnvVars(): string[] {
  return REQUIRED.filter((key) => !getEnv(key));
}
