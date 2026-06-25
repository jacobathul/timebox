-- ============================================================
-- Migration 005: Recurring tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recurring_task_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  notes                   TEXT,
  estimated_minutes       INTEGER,
  priority                TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  context_id              UUID REFERENCES contexts(id) ON DELETE SET NULL,
  project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
  recurrence_rule         TEXT NOT NULL,
  recurrence_summary      TEXT,
  start_date              DATE NOT NULL,
  end_date                DATE,
  default_start_time      TIME,
  default_duration_minutes INTEGER,
  timezone                TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  archived_at             TIMESTAMPTZ
);

ALTER TABLE public.recurring_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own recurring templates"
  ON public.recurring_task_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring templates"
  ON public.recurring_task_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring templates"
  ON public.recurring_task_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring templates"
  ON public.recurring_task_templates FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id
  ON public.recurring_task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_status
  ON public.recurring_task_templates(user_id, status);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurring_template_id UUID REFERENCES public.recurring_task_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_instance_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_status TEXT;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_recurrence_status_check
  CHECK (recurrence_status IS NULL OR recurrence_status IN ('generated', 'skipped', 'moved', 'completed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_recurring_template_instance
  ON public.tasks(user_id, recurring_template_id, recurrence_instance_date);

CREATE INDEX IF NOT EXISTS idx_tasks_recurring_template_id
  ON public.tasks(recurring_template_id);

CREATE OR REPLACE FUNCTION public.ensure_recurrence_ownership()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.recurring_template_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.recurring_task_templates t
      WHERE t.id = NEW.recurring_template_id
        AND t.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Recurring template does not belong to the current user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_ensure_recurrence_ownership ON public.tasks;
CREATE TRIGGER tasks_ensure_recurrence_ownership
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.ensure_recurrence_ownership();

DROP TRIGGER IF EXISTS set_updated_at ON public.recurring_task_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.recurring_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.task_time_entries    WHERE user_id = auth.uid();
  DELETE FROM public.tasks                WHERE user_id = auth.uid();
  DELETE FROM public.recurring_task_templates WHERE user_id = auth.uid();
  DELETE FROM public.projects             WHERE user_id = auth.uid();
  DELETE FROM public.daily_reviews        WHERE user_id = auth.uid();
  DELETE FROM public.user_settings        WHERE user_id = auth.uid();
  DELETE FROM public.calendar_events_cache WHERE user_id = auth.uid();
  DELETE FROM public.profiles             WHERE id = auth.uid();
  DELETE FROM auth.users                  WHERE id = auth.uid();
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','user_settings','projects','tasks','daily_reviews','calendar_events_cache','task_time_entries','recurring_task_templates']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END $$;
