-- ============================================================
-- Time Analytics — performance indexes
-- All required schema columns already exist; this adds indexes
-- for efficient analytics queries filtered by user + date.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_scheduled_date
  ON public.tasks(user_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_project
  ON public.tasks(user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_context
  ON public.tasks(user_id, context_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_at
  ON public.tasks(user_id, completed_at);
