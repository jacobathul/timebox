-- ============================================================
-- Timekeeper — task-level time tracking
-- ============================================================

-- ── Add timekeeper columns to tasks ──────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS active_time_entry_id UUID,
  ADD COLUMN IF NOT EXISTS last_started_at TIMESTAMPTZ;

-- ── task_time_entries ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_time_entries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id           UUID        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  duration_minutes  INTEGER,
  entry_type        TEXT        NOT NULL DEFAULT 'timer' CHECK (entry_type IN ('timer', 'manual')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own entries
CREATE POLICY "Users can view own time entries"
  ON public.task_time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON public.task_time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON public.task_time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
  ON public.task_time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tte_user_id        ON public.task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tte_task_id        ON public.task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_tte_user_task      ON public.task_time_entries(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_tte_user_started   ON public.task_time_entries(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tte_task_ended     ON public.task_time_entries(task_id, ended_at);

-- ── updated_at trigger ────────────────────────────────────────
DROP TRIGGER IF EXISTS set_updated_at ON public.task_time_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.task_time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
