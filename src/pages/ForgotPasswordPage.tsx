import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm';
import { AuthLayout } from './LoginPage';

export function ForgotPasswordPage() {
  return <AuthLayout title="Reset your password" subtitle="We'll send you a secure link"><ForgotPasswordForm /></AuthLayout>;
}
