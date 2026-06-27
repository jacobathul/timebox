-- Migration 006: Google Integrations (Gmail + Google Calendar)
-- Adds connected_accounts table, source metadata on tasks, extends calendar_events_cache.

-- ─── connected_accounts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL DEFAULT 'google',
  provider_account_id TEXT NOT NULL,
  email               TEXT,
  display_name        TEXT,
  -- Tokens are stored with RLS protection (only the owning user can read them).
  -- For production hardening, encrypt at rest using a server-side key.
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  scopes              TEXT[],
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider, provider_account_id)
);

-- ─── Source metadata columns on tasks ─────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS source_provider    TEXT,       -- 'gmail' | 'google_calendar' | null
  ADD COLUMN IF NOT EXISTS source_type        TEXT,       -- 'email' | 'calendar_event' | null
  ADD COLUMN IF NOT EXISTS source_external_id TEXT,       -- Gmail message ID / Calendar event ID
  ADD COLUMN IF NOT EXISTS source_url         TEXT,       -- Deep link back to source
  ADD COLUMN IF NOT EXISTS source_title       TEXT,       -- Original subject / event title
  ADD COLUMN IF NOT EXISTS source_metadata    JSONB;      -- Raw provider payload subset

-- Unique constraint for duplicate-detection: one task per user per source item.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_source_unique_idx
  ON public.tasks (user_id, source_provider, source_external_id)
  WHERE source_provider IS NOT NULL AND source_external_id IS NOT NULL;

-- ─── Extend calendar_events_cache ─────────────────────────────────────────────
ALTER TABLE public.calendar_events_cache
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS location    TEXT,
  ADD COLUMN IF NOT EXISTS is_all_day  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source_url  TEXT,
  ADD COLUMN IF NOT EXISTS attendees   JSONB,
  ADD COLUMN IF NOT EXISTS calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_metadata JSONB;

-- Unique constraint for upsert / dedup on provider events.
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_cache_provider_event_idx
  ON public.calendar_events_cache (user_id, provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS connected_accounts_user_idx ON public.connected_accounts (user_id);
CREATE INDEX IF NOT EXISTS connected_accounts_provider_idx ON public.connected_accounts (provider);
CREATE INDEX IF NOT EXISTS tasks_source_provider_idx ON public.tasks (user_id, source_provider)
  WHERE source_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS calendar_cache_range_idx
  ON public.calendar_events_cache (user_id, provider, start_time, end_time);

-- ─── updated_at trigger for connected_accounts ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connected_accounts_updated_at ON public.connected_accounts;
CREATE TRIGGER connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);
