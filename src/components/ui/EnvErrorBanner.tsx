import { AlertCircle } from 'lucide-react';
import { getMissingEnvVars } from '../../lib/env';

export function EnvErrorBanner() {
  const missing = getMissingEnvVars();
  if (missing.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <h2 className="font-semibold text-stone-800">Missing environment variables</h2>
        </div>
        <p className="text-sm text-stone-600">
          The following required environment variables are not set. The app cannot connect to Supabase without them.
        </p>
        <ul className="space-y-1">
          {missing.map((key) => (
            <li key={key} className="text-sm font-mono bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">{key}</li>
          ))}
        </ul>
        <p className="text-xs text-stone-400">
          Copy <code className="bg-stone-100 px-1 py-0.5 rounded">.env.example</code> to{' '}
          <code className="bg-stone-100 px-1 py-0.5 rounded">.env.local</code> and fill in your Supabase credentials, then restart the dev server.
        </p>
      </div>
    </div>
  );
}
