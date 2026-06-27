import { useEffect } from 'react';
import { Mail, Calendar, Check, AlertCircle, Unlink } from 'lucide-react';
import { useGoogleIntegrationStore } from '../../store/useGoogleIntegrationStore';

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function GoogleIntegrationSettings() {
  const {
    connectedAccount,
    loadingConnection,
    connectGoogle,
    disconnectGoogle,
    fetchConnection,
  } = useGoogleIntegrationStore();

  useEffect(() => {
    void fetchConnection();
  }, [fetchConnection]);

  const isConnected = !!connectedAccount?.isActive;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-700">Google</h3>
        <p className="text-xs text-stone-400 mt-0.5">
          Connect Gmail and Google Calendar to import emails as tasks and view calendar events.
        </p>
      </div>

      {/* Connection card */}
      <div className="border border-stone-200 rounded-xl bg-white overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            {GOOGLE_ICON}
            <div>
              <p className="text-sm font-medium text-stone-800">Google Account</p>
              {isConnected && connectedAccount.email && (
                <p className="text-xs text-stone-400 mt-0.5">{connectedAccount.email}</p>
              )}
            </div>
          </div>

          {loadingConnection ? (
            <div className="w-5 h-5 border-2 border-stone-300 border-t-accent-500 rounded-full animate-spin flex-shrink-0" />
          ) : isConnected ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <Check size={11} />Connected
              </span>
            </div>
          ) : null}
        </div>

        {isConnected ? (
          <div className="border-t border-stone-100 px-4 py-3 bg-stone-50 space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs text-stone-500 bg-white border border-stone-200 px-2 py-1 rounded-lg">
                <Mail size={11} />Gmail (read-only)
              </span>
              <span className="flex items-center gap-1 text-xs text-stone-500 bg-white border border-stone-200 px-2 py-1 rounded-lg">
                <Calendar size={11} />Calendar (read-only)
              </span>
            </div>
            {connectedAccount.lastSyncedAt && (
              <p className="text-xs text-stone-400">
                Last synced {new Date(connectedAccount.lastSyncedAt).toLocaleString()}
              </p>
            )}
            <button
              type="button"
              onClick={() => void disconnectGoogle()}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors mt-1"
            >
              <Unlink size={12} />Disconnect
            </button>
          </div>
        ) : (
          <div className="border-t border-stone-100 px-4 py-3">
            <button
              type="button"
              onClick={() => void connectGoogle()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors shadow-sm"
            >
              {GOOGLE_ICON}
              Connect with Google
            </button>
          </div>
        )}
      </div>

      {/* Scope notice */}
      <div className="flex gap-2 text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          Timebox only requests <strong>read-only</strong> access. We never send or modify your emails or calendar events.
        </span>
      </div>

      {/* Feature cards */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="border border-stone-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-stone-700">
              <Mail size={14} />
              <span className="text-sm font-medium">Gmail Import</span>
            </div>
            <p className="text-xs text-stone-400">
              Browse recent emails and convert them to tasks — subject, sender, and a link back to the original message are auto-filled.
            </p>
          </div>
          <div className="border border-stone-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-stone-700">
              <Calendar size={14} />
              <span className="text-sm font-medium">Calendar Sync</span>
            </div>
            <p className="text-xs text-stone-400">
              Your Google Calendar events appear as read-only blocks on the daily timeline and can be converted to tasks.
            </p>
          </div>
        </div>
      )}

      {/* VITE_GOOGLE_CLIENT_ID not configured warning */}
      {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>VITE_GOOGLE_CLIENT_ID</strong> is not configured. Add it to your <code>.env</code> file to enable Google integrations.
          </span>
        </div>
      )}
    </div>
  );
}
