import { create } from 'zustand';
import { requestGoogleToken, fetchGoogleUserInfo } from '../integrations/google/googleAuth';
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
  return Date.now() >= new Date(expiresAt).getTime() - 5 * 60 * 1000;
}

interface GoogleIntegrationState {
  connectedAccount: ConnectedAccount | null;
  loadingConnection: boolean;

  emails: ParsedEmail[];
  loadingEmails: boolean;
  emailQuery: string;

  calendarEvents: GoogleCalendarEvent[];
  loadingCalendar: boolean;

  fetchConnection: () => Promise<void>;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
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
      // silent
    } finally {
      set({ loadingConnection: false });
    }
  },

  connectGoogle: async () => {
    const uid = getUserId();
    if (!uid) return;
    set({ loadingConnection: true });
    try {
      const { accessToken, expiresIn } = await requestGoogleToken('consent');
      const userInfo = await fetchGoogleUserInfo(accessToken);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      const account = await connectedAccountsService.upsert(uid, {
        provider: 'google',
        providerAccountId: userInfo.sub,
        email: userInfo.email,
        displayName: userInfo.name,
        accessToken,
        refreshToken: null,
        tokenExpiresAt: expiresAt,
        scopes: ['gmail.readonly', 'calendar.readonly'],
      });
      set({ connectedAccount: account });
      toast().addToast('Google account connected', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      // 'access_denied' means the user closed the popup — no error toast needed
      if (msg && msg !== 'access_denied') {
        toast().addToast(`Failed to connect Google: ${msg}`, 'error');
      }
    } finally {
      set({ loadingConnection: false });
    }
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

  getValidAccessToken: async (): Promise<string | null> => {
    const { connectedAccount } = get();
    if (!connectedAccount?.accessToken) return null;
    const uid = getUserId();
    if (!uid) return null;

    if (!isTokenExpired(connectedAccount.tokenExpiresAt)) {
      return connectedAccount.accessToken;
    }

    // Token expired — try a silent re-auth (no popup if user is still signed in to Google)
    try {
      const { accessToken, expiresIn } = await requestGoogleToken('');
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      await connectedAccountsService.updateTokens(connectedAccount.id, uid, {
        accessToken,
        tokenExpiresAt: expiresAt,
      });
      const updated: ConnectedAccount = { ...connectedAccount, accessToken, tokenExpiresAt: expiresAt };
      set({ connectedAccount: updated });
      return accessToken;
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

    const cached = await googleCalendarCacheService.fetchForRange(uid, startDate, endDate).catch(() => []);
    if (cached.length > 0) set({ calendarEvents: cached });

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
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast().addToast(`Calendar sync failed: ${msg}`, 'error');
    } finally {
      set({ loadingCalendar: false });
    }
  },
}));
