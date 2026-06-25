// Mirror of the Supabase DB schema (snake_case).
// These are used only in the service layer; the rest of the app uses the camelCase types in index.ts.

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
  created_at: string;
  updated_at: string;
}
