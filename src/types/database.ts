// Mirror of the Supabase DB schema (snake_case).
// These are used only in the service layer; the rest of the app uses the camelCase types in index.ts.

import type { DayPlan, WeeklyPlanStatus, WeeklyPriorityItem } from './index';

export interface DbContext {
  id: string;
  user_id: string;
  parent_context_id: string | null;
  name: string;
  color: string;
  depth: number;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  project_id: string | null;
  context_id: string | null;
  title: string;
  notes: string;
  estimated_minutes: number;
  actual_minutes: number | null;
  priority: 'low' | 'medium' | 'high';
  status: 'inbox' | 'scheduled' | 'completed' | 'archived';
  scheduled_date: string | null;  // YYYY-MM-DD
  start_time: string | null;      // HH:MM
  end_time: string | null;        // HH:MM
  completed_at: string | null;
  recurring_template_id: string | null;
  recurrence_instance_date: string | null;
  recurrence_status: 'generated' | 'skipped' | 'moved' | 'completed' | null;
  created_at: string;
  updated_at: string;
  // Google integrations (migration 006)
  source_provider: string | null;
  source_type: string | null;
  source_external_id: string | null;
  source_url: string | null;
  source_title: string | null;
  source_metadata: Record<string, unknown> | null;
}

export interface DbConnectedAccount {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  display_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCalendarEvent {
  id: string;
  user_id: string;
  provider: string;
  provider_event_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_read_only: boolean;
  source_calendar_name: string | null;
  source_url: string | null;
  calendar_id: string | null;
  attendees: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
  raw_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Legacy projects (renamed to _legacy_projects in migration 003)
export interface DbLegacyProject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// New projects table (migration 003)
export interface DbProject {
  id: string;
  user_id: string;
  context_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  due_date: string | null;
  status: 'active' | 'completed' | 'archived';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTimeEntry {
  id: string;
  user_id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  entry_type: 'timer' | 'manual';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDailyReview {
  id: string;
  user_id: string;
  review_date: string;
  reflection: string;
  planned_minutes: number;
  completed_minutes: number;
  completed_task_ids: string[];
  unfinished_task_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface DbWeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  status: WeeklyPlanStatus;
  reflection_last_week: string | null;
  weekly_intention: string | null;
  weekly_capacity_minutes: number | null;
  planned_minutes: number | null;
  completed_minutes: number | null;
  selected_project_ids: string[];
  selected_context_ids: string[];
  priority_items: WeeklyPriorityItem[];
  day_plans: Record<string, DayPlan>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  weekly_review_reflection: string | null;
}

export interface DbProfile {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserSettings {
  id: string;
  user_id: string;
  default_day_start_time: string | null;
  default_day_end_time: string | null;
  theme: string | null;
  default_daily_capacity_minutes: number | null;
  workday_start_time: string | null;
  workday_end_time: string | null;
  working_days: number[] | null;
  capacity_warning_enabled: boolean | null;
  overlap_warning_enabled: boolean | null;
  deadline_warning_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbRecurringTaskTemplate {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  estimated_minutes: number | null;
  priority: 'low' | 'medium' | 'high';
  context_id: string | null;
  project_id: string | null;
  recurrence_rule: string;
  recurrence_summary: string | null;
  start_date: string;
  end_date: string | null;
  default_start_time: string | null;
  default_duration_minutes: number | null;
  timezone: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}
