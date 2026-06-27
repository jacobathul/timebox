import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// OAuth now uses the GIS popup flow — no redirect callback needed.
// This page handles any stale bookmarks or accidental navigations.
export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/app/settings/integrations', { replace: true });
  }, [navigate]);
  return null;
}
