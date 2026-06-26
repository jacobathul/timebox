-- ============================================================
-- Weekly planning ritual
-- ============================================================

CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date           DATE NOT NULL,
  week_end_date             DATE NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'draft',
  reflection_last_week      TEXT,
  weekly_intention          TEXT,
  weekly_capacity_minutes   INTEGER,
  planned_minutes           INTEGER,
  completed_minutes         INTEGER,
  selected_project_ids      JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_context_ids      JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority_items            JSONB NOT NULL DEFAULT '[]'::jsonb,
  day_plans                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  weekly_review_reflection  TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  completed_at              TIMESTAMPTZ,
  CONSTRAINT weekly_plans_status_check CHECK (status IN ('draft', 'planned', 'completed', 'archived')),
  CONSTRAINT weekly_plans_user_week_unique UNIQUE (user_id, week_start_date)
);

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their weekly plans select"
  ON public.weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their weekly plans insert"
  ON public.weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their weekly plans update"
  ON public.weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their weekly plans delete"
  ON public.weekly_plans FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id
  ON public.weekly_plans(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week_start
  ON public.weekly_plans(user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_status
  ON public.weekly_plans(status);

DROP TRIGGER IF EXISTS set_weekly_plans_updated_at ON public.weekly_plans;
CREATE TRIGGER set_weekly_plans_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
