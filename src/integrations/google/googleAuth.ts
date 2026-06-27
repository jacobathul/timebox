// Google OAuth 2.0 with PKCE (no client_secret in the browser).
// The client_id comes from VITE_GOOGLE_CLIENT_ID (public, safe to expose).
// GOOGLE_CLIENT_SECRET must NEVER appear in frontend code.

import type { GoogleTokenResponse, GoogleUserInfo, OAuthPkceState } from './types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string
  || `${window.location.origin}/auth/google/callback`;

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

const AUTH_ENDPOINT  = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const PKCE_KEY = 'google_oauth_pkce';

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(plain: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64urlEncode(hashed);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Redirect browser to Google consent screen. */
export async function startGoogleOAuth(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');

  const codeVerifier = base64urlEncode(randomBytes(64));
  const state        = base64urlEncode(randomBytes(32));
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const pkce: OAuthPkceState = { codeVerifier, state };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    response_type:         'code',
    scope:                 SCOPES,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent',
    state,
  });

  window.location.href = `${AUTH_ENDPOINT}?${params}`;
}

/** Exchange the authorization code for tokens. Call this on the callback page. */
export async function exchangeCodeForTokens(
  code: string,
  returnedState: string,
): Promise<GoogleTokenResponse> {
  const raw = sessionStorage.getItem(PKCE_KEY);
  if (!raw) throw new Error('No PKCE state found in sessionStorage');

  const pkce: OAuthPkceState = JSON.parse(raw);
  sessionStorage.removeItem(PKCE_KEY);

  if (pkce.state !== returnedState) throw new Error('OAuth state mismatch — possible CSRF');

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    grant_type:    'authorization_code',
    code,
    code_verifier: pkce.codeVerifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${err.error_description ?? res.statusText}`);
  }
  return res.json() as Promise<GoogleTokenResponse>;
}

/** Refresh an expired access token using the stored refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${err.error_description ?? res.statusText}`);
  }
  return res.json() as Promise<GoogleTokenResponse>;
}

/** Fetch basic profile info for the authenticated user. */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  return res.json() as Promise<GoogleUserInfo>;
}
