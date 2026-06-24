import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function AuthCallbackPage() {
  const { user, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;
    // Supabase's detectSessionInUrl: true already parsed the hash and fired
    // onAuthStateChange by the time we reach this effect.
    navigate(user ? '/app/today' : '/login', { replace: true });
  }, [initialized, user, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-surface-50">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-stone-400">Signing you in…</p>
    </div>
  );
}
