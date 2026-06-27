-- ============================================================
-- Migration 007: Add capacity & warning settings to user_settings
-- ============================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS default_daily_capacity_minutes  INTEGER   DEFAULT 300,
  ADD COLUMN IF NOT EXISTS workday_start_time              TEXT      DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS workday_end_time                TEXT      DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS working_days                    INTEGER[] DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS capacity_warning_enabled        BOOLEAN   DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS overlap_warning_enabled         BOOLEAN   DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deadline_warning_enabled        BOOLEAN   DEFAULT TRUE;
