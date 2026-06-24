import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Include at least one number';
  return null;
}

export function ResetPasswordForm() {
  const { updatePassword, loading } = useAuthStore();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    const { error: err } = await updatePassword(password);
    if (err) { setError('Failed to reset password. The link may have expired.'); return; }
    setDone(true);
    setTimeout(() => navigate('/app/today'), 2500);
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h3 className="font-semibold text-stone-800">Password updated!</h3>
        <p className="text-sm text-stone-400">Redirecting you to the app…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">New password</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Confirm password</label>
        <input
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
          placeholder="Repeat your new password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 transition-colors shadow-sm"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>
    </form>
  );
}
