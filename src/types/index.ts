export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'inbox' | 'scheduled' | 'completed';
export type AppView = 'daily' | 'weekly' | 'plan' | 'review';

export interface Task {
  id: string;
  title: string;
  notes: string;
  estimatedMinutes: number;
  actualMinutes: number | null;
  priority: Priority;
  status: TaskStatus;
  projectId: string | null;
  scheduledDate: string | null; // ISO date string "YYYY-MM-DD"
  startTime: string | null;     // "HH:MM" in 24h
  endTime: string | null;       // "HH:MM" in 24h
  completedAt: string | null;   // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
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
