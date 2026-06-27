import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { EnvErrorBanner } from './components/ui/EnvErrorBanner';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { GoogleAuthCallbackPage } from './pages/GoogleAuthCallbackPage';
import { useStore } from './store/useStore';

function useKeyboardShortcuts() {
  const { isTaskModalOpen, openTaskModal } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (isTaskModalOpen || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      switch (e.key.toLowerCase()) {
        case 'n': e.preventDefault(); openTaskModal(); break;
        case 'p': e.preventDefault(); navigate('/app/plan'); break;
        case 'r': e.preventDefault(); navigate('/app/review'); break;
        case 'd': e.preventDefault(); navigate('/app/today'); break;
        case 'w': e.preventDefault(); navigate('/app/weekly-planning'); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTaskModalOpen, openTaskModal, navigate]);
}

function AppWithShortcuts() {
  useKeyboardShortcuts();
  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <EnvErrorBanner />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppWithShortcuts />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/app/today" replace />} />
          <Route path="*" element={<Navigate to="/app/today" replace />} />
        </Routes>
      </AuthProvider>
      <Analytics />
    </BrowserRouter>
  );
}
