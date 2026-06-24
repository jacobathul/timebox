-- ============================================================
-- FlowDay — initial schema with RLS
-- Run this in: Supabase dashboard → SQL Editor → Run
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  timezone      TEXT DEFAULT 'UTC',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── user_settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_day_start_time TEXT DEFAULT '06:00',
  default_day_end_time   TEXT DEFAULT '23:00',
  theme                  TEXT DEFAULT 'light',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their settings"
  ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- ── projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#0ea5e9',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their projects"
  ON public.projects FOR ALL USING (auth.uid() = user_id);

-- ── tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  notes             TEXT DEFAULT '',
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  actual_minutes    INTEGER,
  priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status            TEXT NOT NULL DEFAULT 'inbox'  CHECK (status  IN ('inbox','scheduled','completed','archived')),
  scheduled_date    DATE,
  start_time        TEXT,        -- "HH:MM" 24h
  end_time          TEXT,        -- "HH:MM" 24h
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their tasks"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- ── daily_reviews ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date          DATE NOT NULL,
  reflection           TEXT DEFAULT '',
  planned_minutes      INTEGER DEFAULT 0,
  completed_minutes    INTEGER DEFAULT 0,
  completed_task_ids   JSONB DEFAULT '[]',
  unfinished_task_ids  JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, review_date)
);

ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their reviews"
  ON public.daily_reviews FOR ALL USING (auth.uid() = user_id);

-- ── calendar_events_cache ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_events_cache (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider             TEXT NOT NULL DEFAULT 'local',
  provider_event_id    TEXT,
  title                TEXT NOT NULL,
  start_time           TIMESTAMPTZ NOT NULL,
  end_time             TIMESTAMPTZ NOT NULL,
  is_read_only         BOOLEAN DEFAULT FALSE,
  source_calendar_name TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_events_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their calendar cache"
  ON public.calendar_events_cache FOR ALL USING (auth.uid() = user_id);

-- ── delete_user function (called from client via rpc) ────────
-- Allows a logged-in user to self-delete their account securely
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.tasks                WHERE user_id = auth.uid();
  DELETE FROM public.projects             WHERE user_id = auth.uid();
  DELETE FROM public.daily_reviews        WHERE user_id = auth.uid();
  DELETE FROM public.user_settings        WHERE user_id = auth.uid();
  DELETE FROM public.calendar_events_cache WHERE user_id = auth.uid();
  DELETE FROM public.profiles             WHERE id = auth.uid();
  DELETE FROM auth.users                  WHERE id = auth.uid();
END;
$$;

-- ── updated_at auto-trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','user_settings','projects','tasks','daily_reviews','calendar_events_cache']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END $$;
