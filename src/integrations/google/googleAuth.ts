// Google Identity Services (GIS) token client.
// This approach requests an access_token directly via a popup — no code exchange,
// no client_secret needed in the browser. The trade-off vs PKCE is no refresh_token;
// silent re-auth via GIS works as long as the user has an active Google session.

import type { GoogleUserInfo } from './types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

const SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

// Minimal type shim for the GIS token client
interface TokenResponse {
  access_token: string;
  expires_in: string;
  scope: string;
  error?: string;
  error_description?: string;
}

export interface GisTokenResult {
  accessToken: string;
  expiresIn: number;
  scope: string;
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    if ((window as { google?: unknown }).google) { resolve(); return; }
    const existing = document.getElementById('google-gis-script');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

/** Request a Google access token via the GIS popup.
 *  prompt='consent' → always shows the consent screen (first connect)
 *  prompt=''        → silent re-auth (no UI if user already authorised) */
export async function requestGoogleToken(
  prompt: '' | 'consent' | 'select_account' = 'consent',
): Promise<GisTokenResult> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  await loadGisScript();

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt,
      callback: (response: TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        resolve({
          accessToken: response.access_token,
          expiresIn: Number(response.expires_in),
          scope: response.scope,
        });
      },
    });
    client.requestAccessToken();
  });
}

/** Fetch basic profile info for the authenticated user. */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  return res.json() as Promise<GoogleUserInfo>;
}
