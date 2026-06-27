import type { GmailListResponse, GmailMessage, ParsedEmail } from './types';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return atob(padded);
  }
}

function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractTextBody(payload: GmailMessage['payload']): string {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractTextBody(part);
      if (text) return text;
    }
  }
  return '';
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2] };
  return { name: from, email: from };
}

export function buildGmailUrl(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#all/${messageId}`;
}

export function parseToParsedEmail(msg: GmailMessage): ParsedEmail {
  const subject  = getHeader(msg, 'Subject') || '(no subject)';
  const from     = getHeader(msg, 'From');
  const dateStr  = getHeader(msg, 'Date');
  const { name, email } = parseFromHeader(from);
  const bodyText = extractTextBody(msg.payload).slice(0, 2000);
  const date     = dateStr ? new Date(dateStr).toISOString() : new Date(Number(msg.internalDate)).toISOString();

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject,
    from: name || email,
    fromEmail: email,
    date,
    snippet: msg.snippet ?? '',
    bodyText,
    url: buildGmailUrl(msg.id),
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listMessages(
  accessToken: string,
  options: { query?: string; maxResults?: number; pageToken?: string } = {},
): Promise<GmailListResponse> {
  const params = new URLSearchParams({
    maxResults: String(options.maxResults ?? 20),
    ...(options.query && { q: options.query }),
    ...(options.pageToken && { pageToken: options.pageToken }),
  });

  const res = await fetch(`${BASE_URL}/messages?${params}`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) throw new Error(`Gmail list failed: ${res.statusText}`);
  return res.json() as Promise<GmailListResponse>;
}

export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const params = new URLSearchParams({ format: 'full' });
  const res = await fetch(`${BASE_URL}/messages/${messageId}?${params}`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) throw new Error(`Gmail get message failed: ${res.statusText}`);
  return res.json() as Promise<GmailMessage>;
}

/** Fetch a batch of messages (list + individual fetches). */
export async function fetchRecentEmails(
  accessToken: string,
  options: { query?: string; maxResults?: number } = {},
): Promise<ParsedEmail[]> {
  const list = await listMessages(accessToken, options);
  if (!list.messages?.length) return [];

  const messages = await Promise.all(
    list.messages.map((m) => getMessage(accessToken, m.id)),
  );
  return messages.map(parseToParsedEmail);
}
