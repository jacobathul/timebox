import { create } from 'zustand';
import { startGoogleOAuth, exchangeCodeForTokens, fetchGoogleUserInfo, refreshAccessToken } from '../integrations/google/googleAuth';
import { fetchRecentEmails } from '../integrations/google/gmailClient';
import { fetchEventsForRange } from '../integrations/google/googleCalendarClient';
import { connectedAccountsService } from '../services/connectedAccounts.service';
import { googleCalendarCacheService } from '../services/googleCalendarCache.service';
import { useAuthStore } from './useAuthStore';
import { useToastStore } from './useToastStore';
import type { ConnectedAccount, GoogleCalendarEvent } from '../types';
import type { ParsedEmail } from '../integrations/google/types';

function getUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
function toast() {
  return useToastStore.getState();
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  // Refresh 5 minutes early
  return Date.now() >= new Date(expiresAt).getTime() - 5 * 60 * 1000;
}

interface GoogleIntegrationState {
  // Connection state
  connectedAccount: ConnectedAccount | null;
  loadingConnection: boolean;

  // Gmail state
  emails: ParsedEmail[];
  loadingEmails: boolean;
  emailQuery: string;

  // Calendar state
  calendarEvents: GoogleCalendarEvent[];
  loadingCalendar: boolean;

  // Actions
  fetchConnection: () => Promise<void>;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;

  fetchEmails: (query?: string) => Promise<void>;
  setEmailQuery: (q: string) => void;

  fetchCalendarEvents: (startDate: string, endDate: string) => Promise<void>;
}

export const useGoogleIntegrationStore = create<GoogleIntegrationState>()((set, get) => ({
  connectedAccount: null,
  loadingConnection: false,
  emails: [],
  loadingEmails: false,
  emailQuery: '',
  calendarEvents: [],
  loadingCalendar: false,

  fetchConnection: async () => {
    const uid = getUserId();
    if (!uid) return;
    set({ loadingConnection: true });
    try {
      const account = await connectedAccountsService.fetchByProvider(uid, 'google');
      set({ connectedAccount: account });
    } catch {
      // silent — user may not have a connected account
    } finally {
      set({ loadingConnection: false });
    }
  },

  connectGoogle: async () => {
    await startGoogleOAuth();
  },

  disconnectGoogle: async () => {
    const uid = getUserId();
    const { connectedAccount } = get();
    if (!uid || !connectedAccount) return;
    try {
      await connectedAccountsService.disconnect(connectedAccount.id, uid);
      set({ connectedAccount: null, emails: [], calendarEvents: [] });
      toast().addToast('Google account disconnected', 'success');
    } catch {
      toast().addToast('Failed to disconnect Google account', 'error');
    }
  },

  handleOAuthCallback: async (code, state) => {
    const uid = getUserId();
    if (!uid) throw new Error('Not authenticated');

    const tokens = await exchangeCodeForTokens(code, state);
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const account = await connectedAccountsService.upsert(uid, {
      provider: 'google',
      providerAccountId: userInfo.sub,
      email: userInfo.email,
      displayName: userInfo.name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope.split(' '),
    });
    set({ connectedAccount: account });
  },

  getValidAccessToken: async (): Promise<string | null> => {
    const { connectedAccount } = get();
    if (!connectedAccount?.accessToken) return null;
    const uid = getUserId();
    if (!uid) return null;

    if (!isTokenExpired(connectedAccount.tokenExpiresAt)) {
      return connectedAccount.accessToken;
    }

    if (!connectedAccount.refreshToken) return null;

    try {
      const newTokens = await refreshAccessToken(connectedAccount.refreshToken);
      const expiresAt = newTokens.expires_in
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : null;
      await connectedAccountsService.updateTokens(connectedAccount.id, uid, {
        accessToken: newTokens.access_token,
        tokenExpiresAt: expiresAt,
      });
      const updated: ConnectedAccount = {
        ...connectedAccount,
        accessToken: newTokens.access_token,
        tokenExpiresAt: expiresAt,
      };
      set({ connectedAccount: updated });
      return newTokens.access_token;
    } catch {
      toast().addToast('Google session expired — please reconnect', 'error');
      set({ connectedAccount: null });
      return null;
    }
  },

  fetchEmails: async (query = '') => {
    const accessToken = await get().getValidAccessToken();
    if (!accessToken) return;
    set({ loadingEmails: true, emailQuery: query });
    try {
      const emails = await fetchRecentEmails(accessToken, { query: query || undefined, maxResults: 25 });
      set({ emails });
    } catch {
      toast().addToast('Failed to fetch emails', 'error');
    } finally {
      set({ loadingEmails: false });
    }
  },

  setEmailQuery: (q) => set({ emailQuery: q }),

  fetchCalendarEvents: async (startDate, endDate) => {
    const uid = getUserId();
    if (!uid) return;

    // First try cache
    const cached = await googleCalendarCacheService.fetchForRange(uid, startDate, endDate).catch(() => []);

    if (cached.length > 0) {
      set({ calendarEvents: cached });
    }

    // Refresh from API
    const accessToken = await get().getValidAccessToken();
    if (!accessToken) return;

    set({ loadingCalendar: true });
    try {
      const events = await fetchEventsForRange(accessToken, startDate, endDate);
      await googleCalendarCacheService.upsertEvents(uid, events);
      const fresh = await googleCalendarCacheService.fetchForRange(uid, startDate, endDate);
      set({ calendarEvents: fresh });
      const { connectedAccount } = get();
      if (connectedAccount) {
        await connectedAccountsService.markLastSynced(connectedAccount.id, uid);
      }
    } catch {
      // Keep the cached data, don't show error for background sync
    } finally {
      set({ loadingCalendar: false });
    }
  },
}));
