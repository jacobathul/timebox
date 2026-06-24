// Mirror of the Supabase DB schema (snake_case).
// These are used only in the service layer; the rest of the app uses the camelCase types in index.ts.

export interface DbTask {
  id: string;
  user_id: string;
  project_id: string | null;
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

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  color: string;
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
