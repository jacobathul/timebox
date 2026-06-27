import { supabase } from '../lib/supabase';
import type { ConnectedAccount } from '../types';
import type { DbConnectedAccount } from '../types/database';

function dbToAccount(db: DbConnectedAccount): ConnectedAccount {
  return {
    id: db.id,
    userId: db.user_id,
    provider: db.provider as 'google',
    providerAccountId: db.provider_account_id,
    email: db.email,
    displayName: db.display_name,
    accessToken: db.access_token,
    refreshToken: db.refresh_token,
    tokenExpiresAt: db.token_expires_at,
    scopes: db.scopes ?? [],
    isActive: db.is_active,
    lastSyncedAt: db.last_synced_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const connectedAccountsService = {
  async fetchAll(userId: string): Promise<ConnectedAccount[]> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
    return (data as DbConnectedAccount[]).map(dbToAccount);
  },

  async fetchByProvider(userId: string, provider: string): Promise<ConnectedAccount | null> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToAccount(data as DbConnectedAccount) : null;
  },

  async upsert(
    userId: string,
    account: {
      provider: string;
      providerAccountId: string;
      email: string | null;
      displayName: string | null;
      accessToken: string;
      refreshToken: string | null;
      tokenExpiresAt: string | null;
      scopes: string[];
    },
  ): Promise<ConnectedAccount> {
    const { data, error } = await supabase
      .from('connected_accounts')
      .upsert(
        {
          user_id:             userId,
          provider:            account.provider,
          provider_account_id: account.providerAccountId,
          email:               account.email,
          display_name:        account.displayName,
          access_token:        account.accessToken,
          refresh_token:       account.refreshToken,
          token_expires_at:    account.tokenExpiresAt,
          scopes:              account.scopes,
          is_active:           true,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: 'user_id,provider,provider_account_id' },
      )
      .select()
      .single();
    if (error) throw error;
    return dbToAccount(data as DbConnectedAccount);
  },

  async updateTokens(
    id: string,
    userId: string,
    tokens: { accessToken: string; tokenExpiresAt: string | null },
  ): Promise<void> {
    const { error } = await supabase
      .from('connected_accounts')
      .update({
        access_token:     tokens.accessToken,
        token_expires_at: tokens.tokenExpiresAt,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async markLastSynced(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('connected_accounts')
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async disconnect(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('connected_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
