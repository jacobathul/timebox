import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleIntegrationStore } from '../store/useGoogleIntegrationStore';
import { useAuthStore } from '../store/useAuthStore';

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useGoogleIntegrationStore();
  const { user, loading: authLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    // Wait until auth state is resolved before trying to persist tokens
    if (authLoading || handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code  = params.get('code');
    const state = params.get('state');
    const err   = params.get('error');

    if (err) {
      setError(`Google denied access: ${err}`);
      return;
    }
    if (!code || !state) {
      setError('Invalid callback — missing code or state');
      return;
    }
    if (!user) {
      // Session expired during the OAuth round-trip
      setError('Your session expired. Please log in and try again.');
      return;
    }

    handleOAuthCallback(code, state)
      .then(() => navigate('/app/settings/integrations', { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Connection failed'));
  }, [authLoading, user, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-modal p-6 text-center space-y-4">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/app/settings/integrations', { replace: true })}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
        <p className="text-sm text-stone-500">Connecting your Google account…</p>
      </div>
    </div>
  );
}
