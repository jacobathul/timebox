import type { Task, Project } from '../types';

const OLD_STORAGE_KEY = 'flowday-storage'; // monolithic store from v1

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isGuestTask(task: Task): boolean {
  // Guest tasks are locally generated IDs (non-UUID). Synced cloud rows are UUID IDs.
  return !isUuidLike(task.id);
}

/**
 * Read tasks and projects from the old localStorage format.
 * Returns null if nothing to migrate.
 */
export function getLocalGuestData(): { tasks: Task[]; projects: Project[] } | null {
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const tasks: Task[] = parsed?.state?.tasks ?? [];
    const projects: Project[] = parsed?.state?.projects ?? [];
    // Filter out the demo tasks (their IDs start with "demo-")
    const realTasks = tasks.filter((t) => !t.id.startsWith('demo-') && isGuestTask(t));
    if (realTasks.length === 0) return null;
    return { tasks: realTasks, projects };
  } catch {
    return null;
  }
}

/** Also checks the new per-store localStorage key for tasks created as a guest */
export function getNewFormatGuestTasks(): Task[] {
  try {
    const raw = localStorage.getItem('timebox-tasks');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const tasks: Task[] = parsed?.state?.tasks ?? [];
    return tasks.filter((t) => !t.id.startsWith('demo-') && isGuestTask(t));
  } catch {
    return [];
  }
}

/** Merge and deduplicate guest tasks from old and new formats */
export function collectMigratableTasks(): Task[] {
  const oldTasks = getLocalGuestData()?.tasks ?? [];
  const newTasks = getNewFormatGuestTasks();
  const seen = new Set<string>();
  return [...oldTasks, ...newTasks].filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

export function clearGuestStorage(): void {
  localStorage.removeItem(OLD_STORAGE_KEY);
  localStorage.removeItem('timebox-tasks');
  localStorage.removeItem('timebox-projects');
}

/**
 * One-time shim: copy tasks+projects from the old monolithic localStorage key
 * into the new per-store keys so existing guests keep their data on first load.
 * Safe to call multiple times (no-ops after the first run).
 */
export function shimOldStorageToNewKeys(): void {
  const DONE_KEY = 'timebox-migrated-v2';
  if (localStorage.getItem(DONE_KEY)) return;

  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (raw) {
      const { state } = JSON.parse(raw) as { state: { tasks?: Task[]; projects?: Project[]; reviews?: unknown[] } };

      if (state?.tasks && !localStorage.getItem('timebox-tasks')) {
        localStorage.setItem('timebox-tasks', JSON.stringify({
          state: { tasks: state.tasks, reviews: state.reviews ?? [] },
          version: 0,
        }));
      }
      if (state?.projects && !localStorage.getItem('timebox-projects')) {
        localStorage.setItem('timebox-projects', JSON.stringify({
          state: { projects: state.projects },
          version: 0,
        }));
      }
    }
  } catch { /* ignore parse errors */ }

  localStorage.setItem(DONE_KEY, 'true');
}
