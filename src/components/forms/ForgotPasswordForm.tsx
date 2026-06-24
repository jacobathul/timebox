import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function ForgotPasswordForm() {
  const { resetPassword, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await resetPassword(email);
    setSent(true); // Always show success — don't reveal whether account exists
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-accent-500" />
        </div>
        <h3 className="font-semibold text-stone-800">Email sent</h3>
        <p className="text-sm text-stone-400 max-w-xs mx-auto">
          If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
        </p>
        <Link to="/login" className="text-sm text-accent-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 transition-colors shadow-sm"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>

      <p className="text-center text-sm text-stone-400">
        <Link to="/login" className="text-accent-500 hover:text-accent-600 font-medium">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
