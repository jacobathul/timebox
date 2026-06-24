import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Include at least one number';
  return null;
}

export function SignupForm() {
  const { signup, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    const { error: err, needsConfirmation } = await signup(email, password);
    if (err) { setError(err); return; }
    if (needsConfirmation) setDone(true);
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h3 className="font-semibold text-stone-800">Check your email</h3>
        <p className="text-sm text-stone-400 max-w-xs mx-auto">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link to="/login" className="text-sm text-accent-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const pwError = password ? validatePassword(password) : null;
  const strength = !password ? 0 : password.length >= 12 && !pwError ? 3 : !pwError ? 2 : 1;
  const BAR = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-300 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Password</label>
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
        {/* Strength bar */}
        {password && (
          <div className="flex gap-1 mt-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-all ${n <= strength ? BAR[strength] : 'bg-stone-100'}`}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-stone-400">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-500 hover:text-accent-600 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
