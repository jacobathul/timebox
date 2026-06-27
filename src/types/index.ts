export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'inbox' | 'scheduled' | 'completed';
export type AppView = 'daily' | 'weekly' | 'plan' | 'review';
export type SourceProvider = 'gmail' | 'google_calendar';
export type SourceType = 'email' | 'calendar_event';
export type TimeEntryType = 'timer' | 'manual';
export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'none';
export type RecurringTemplateStatus = 'active' | 'paused' | 'archived';
export type RecurrenceInstanceStatus = 'generated' | 'skipped' | 'moved' | 'completed';
export type WeeklyPlanStatus = 'draft' | 'planned' | 'completed' | 'archived';

export interface WeeklyPriorityItem {
  id: string;
  text: string;
  type: 'project' | 'task' | 'context' | 'custom';
  projectId?: string | null;
  taskId?: string | null;
  contextId?: string | null;
  completed?: boolean;
}

export interface DayPlan {
  date: string;
  focusProjectIds: string[];
  focusTaskIds: string[];
  focusContextIds: string[];
  plannedMinutes: number;
  notes?: string;
}

export interface WeeklyPlan {
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
}

export interface TaskTimeEntry {
  id: string;
  userId: string;
  taskId: string;
  startedAt: string;      // ISO timestamp
  endedAt: string | null; // null = timer still running
  durationMinutes: number | null;
  entryType: TimeEntryType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  estimatedMinutes: number;
  actualMinutes: number | null;
  priority: Priority;
  status: TaskStatus;
  contextId: string | null;
  projectId: string | null;
  scheduledDate: string | null; // ISO date string "YYYY-MM-DD"
  startTime: string | null;     // "HH:MM" in 24h
  endTime: string | null;       // "HH:MM" in 24h
  completedAt: string | null;   // ISO timestamp
  recurringTemplateId: string | null;
  recurrenceInstanceDate: string | null;
  recurrenceStatus: RecurrenceInstanceStatus | null;
  createdAt: string;
  updatedAt: string;
  // Google integrations source metadata
  sourceProvider: SourceProvider | null;
  sourceType: SourceType | null;
  sourceExternalId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceMetadata: Record<string, unknown> | null;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: 'google';
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleCalendarEvent {
  id: string;
  userId: string;
  provider: 'google_calendar';
  providerEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;    // ISO timestamp
  endTime: string;      // ISO timestamp
  isAllDay: boolean;
  isReadOnly: boolean;
  sourceCalendarName: string | null;
  sourceUrl: string | null;
  calendarId: string | null;
  attendees: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
  rawMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface AppProject {
  id: string;
  user_id: string;
  context_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  due_date: string | null;
  status: ProjectStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppProjectWithStats extends AppProject {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  progressPercentage: number;
}

// Legacy — kept for type compatibility; superseded by AppProject
export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface ProjectContext {
  id: string;
  user_id: string;
  parent_context_id: string | null;
  name: string;
  color: string;
  depth: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringTaskTemplate {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  estimatedMinutes: number | null;
  priority: Priority;
  contextId: string | null;
  projectId: string | null;
  recurrenceRule: string;
  recurrenceSummary: string | null;
  startDate: string;
  endDate: string | null;
  defaultStartTime: string | null;
  defaultDurationMinutes: number | null;
  timezone: string;
  status: RecurringTemplateStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ContextTreeNode extends ProjectContext {
  children: ContextTreeNode[];
}

export interface DailyReview {
  date: string; // "YYYY-MM-DD"
  completedTaskIds: string[];
  unfinishedTaskIds: string[];
  reflection: string;
  plannedMinutes: number;
  completedMinutes: number;
}

export interface OverlapWarning {
  taskA: string;
  taskB: string;
}

// Used for drag-and-drop payload
export interface DragData {
  type: 'task';
  taskId: string;
  source: 'inbox' | 'calendar';
}
