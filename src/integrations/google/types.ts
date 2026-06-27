// Raw API response shapes from Google's APIs.
// These are NOT the app's domain types — see src/types/index.ts for those.

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;   // seconds
  token_type: 'Bearer';
  scope: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  sub: string;          // Google account ID
  email: string;
  name: string;
  picture?: string;
}

// Gmail API shapes
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: GmailPayload;
  internalDate?: string; // Unix ms as string
}

export interface GmailPayload {
  partId?: string;
  mimeType: string;
  headers: GmailHeader[];
  body?: { data?: string; size: number };
  parts?: GmailPayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

// Decoded, normalised Gmail message ready for the UI
export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromEmail: string;
  date: string;         // ISO timestamp
  snippet: string;
  bodyText: string;
  url: string;          // https://mail.google.com/mail/u/0/#all/{id}
}

// Google Calendar API shapes
export interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end:   { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  organizer?: { email: string; displayName?: string };
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface GCalListResponse {
  items: GCalEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// PKCE OAuth state persisted in sessionStorage during the handshake
export interface OAuthPkceState {
  codeVerifier: string;
  state: string;        // random nonce to guard against CSRF
}
