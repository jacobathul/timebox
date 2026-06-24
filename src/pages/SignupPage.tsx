import { Navigate } from 'react-router-dom';
import { SignupForm } from '../components/forms/SignupForm';
import { AuthLayout } from './LoginPage';
import { useAuthStore } from '../store/useAuthStore';

export function SignupPage() {
  const { user, initialized } = useAuthStore();
  if (initialized && user) return <Navigate to="/app/today" replace />;
  return <AuthLayout title="Create your account" subtitle="Start planning your days with Timebox"><SignupForm /></AuthLayout>;
}
