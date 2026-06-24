import { ResetPasswordForm } from '../components/forms/ResetPasswordForm';
import { AuthLayout } from './LoginPage';

export function ResetPasswordPage() {
  // Supabase automatically picks up the access_token from the URL hash
  // via detectSessionInUrl: true in the client config, so by the time
  // the user fills this form, they already have a valid session.
  return <AuthLayout title="Set a new password" subtitle="Choose something strong"><ResetPasswordForm /></AuthLayout>;
}
