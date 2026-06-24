import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/forms/LoginForm';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const { user, initialized } = useAuthStore();
  if (initialized && user) return <Navigate to="/app" replace />;

  return <AuthLayout title="Welcome back" subtitle="Sign in to your FlowDay account"><LoginForm /></AuthLayout>;
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-lg font-bold">F</span>
          </div>
          <span className="font-semibold text-stone-800 text-xl tracking-tight">FlowDay</span>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-stone-200 p-6">
          <h1 className="text-lg font-semibold text-stone-800 mb-0.5">{title}</h1>
          <p className="text-sm text-stone-400 mb-5">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export { AuthLayout };
