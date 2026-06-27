import type { Task, AppProject, GoogleCalendarEvent, PlanningWarning, PlanningWarningType, PlanningWarningSeverity } from '../../types';
import type { UserSettings } from '../../store/useSettingsStore';
import { timeToMinutes, todayStr } from '../../utils/time';

export type { PlanningWarning, PlanningWarningType, PlanningWarningSeverity };

export interface PlanningWarningInput {
  tasks: Task[];
  projects?: AppProject[];
  calendarEvents?: GoogleCalendarEvent[];
  settings: UserSettings;
  dateRange?: { start: string; end: string };
}

let _warningIdCounter = 0;
function makeId(type: PlanningWarningType): string {
  return `${type}_${++_warningIdCounter}_${Date.now()}`;
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function workingDaysBetween(startDate: string, endDate: string, workingDays: number[]): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    // getDay(): 0=Sun,1=Mon,...,6=Sat; our convention: 1=Mon,...,7=Sun
    const jsDay = cur.getDay();
    const ourDay = jsDay === 0 ? 7 : jsDay;
    if (workingDays.includes(ourDay)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function isWorkingDay(dateStr: string, workingDays: number[]): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const jsDay = d.getDay();
  const ourDay = jsDay === 0 ? 7 : jsDay;
  return workingDays.includes(ourDay);
}

// ── Task overlap detection ────────────────────────────────────────────────────

export function detectTaskOverlaps(tasks: Task[]): PlanningWarning[] {
  const scheduled = tasks.filter((t) => t.scheduledDate && t.startTime && t.endTime && t.status !== 'completed');
  const warnings: PlanningWarning[] = [];

  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];
      if (a.scheduledDate !== b.scheduledDate) continue;
      const aStart = timeToMinutes(a.startTime!);
      const aEnd = timeToMinutes(a.endTime!);
      const bStart = timeToMinutes(b.startTime!);
      const bEnd = timeToMinutes(b.endTime!);
      if (aStart < bEnd && bStart < aEnd) {
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        const olStart = formatTime12(`${String(Math.floor(overlapStart / 60)).padStart(2, '0')}:${String(overlapStart % 60).padStart(2, '0')}`);
        const olEnd = formatTime12(`${String(Math.floor(overlapEnd / 60)).padStart(2, '0')}:${String(overlapEnd % 60).padStart(2, '0')}`);
        warnings.push({
          id: makeId('task_overlap'),
          type: 'task_overlap',
          severity: 'warning',
          title: 'Task overlap',
          message: `'${a.title}' overlaps with '${b.title}' from ${olStart}–${olEnd}.`,
          taskId: a.id,
          date: a.scheduledDate ?? undefined,
          relatedEntityIds: [a.id, b.id],
          actionLabel: 'Reschedule task',
          actionType: 'open_task',
          dismissible: true,
        });
      }
    }
  }
  return warnings;
}

// ── Calendar overlap detection ────────────────────────────────────────────────

export function detectCalendarOverlaps(tasks: Task[], calendarEvents: GoogleCalendarEvent[]): PlanningWarning[] {
  const scheduled = tasks.filter((t) => t.scheduledDate && t.startTime && t.endTime && t.status !== 'completed');
  const warnings: PlanningWarning[] = [];

  for (const task of scheduled) {
    const taskStart = timeToMinutes(task.startTime!);
    const taskEnd = timeToMinutes(task.endTime!);
    const taskDate = task.scheduledDate!;

    for (const evt of calendarEvents) {
      if (evt.isAllDay) continue;
      const evtStart = new Date(evt.startTime);
      const evtEnd = new Date(evt.endTime);
      const evtDate = `${evtStart.getFullYear()}-${String(evtStart.getMonth() + 1).padStart(2, '0')}-${String(evtStart.getDate()).padStart(2, '0')}`;
      if (evtDate !== taskDate) continue;

      const evtStartMins = evtStart.getHours() * 60 + evtStart.getMinutes();
      const evtEndMins = evtEnd.getHours() * 60 + evtEnd.getMinutes();

      if (taskStart < evtEndMins && evtStartMins < taskEnd) {
        const evtStartStr = formatTime12(`${String(evtStart.getHours()).padStart(2, '0')}:${String(evtStart.getMinutes()).padStart(2, '0')}`);
        const evtEndStr = formatTime12(`${String(evtEnd.getHours()).padStart(2, '0')}:${String(evtEnd.getMinutes()).padStart(2, '0')}`);

        const fullyOverlaps = taskStart >= evtStartMins && taskEnd <= evtEndMins;
        const severity: PlanningWarningSeverity = (evt.isReadOnly && fullyOverlaps) ? 'critical' : 'warning';

        warnings.push({
          id: makeId('calendar_overlap'),
          type: 'calendar_overlap',
          severity,
          title: 'Calendar event conflict',
          message: `'${task.title}' overlaps with '${evt.title}' from ${evtStartStr}–${evtEndStr}.`,
          taskId: task.id,
          date: taskDate,
          relatedEntityIds: [task.id, evt.id],
          actionLabel: 'Move task',
          actionType: 'open_task',
          dismissible: true,
        });
      }
    }
  }
  return warnings;
}

// ── Daily capacity warnings ───────────────────────────────────────────────────

export function detectDailyCapacityWarnings(tasks: Task[], settings: UserSettings, date: string): PlanningWarning[] {
  const dayTasks = tasks.filter((t) => t.scheduledDate === date && t.status !== 'completed');
  if (dayTasks.length === 0) return [];

  let plannedMinutes = 0;
  for (const t of dayTasks) {
    if (t.startTime && t.endTime) {
      const dur = timeToMinutes(t.endTime) - timeToMinutes(t.startTime);
      plannedMinutes += Math.max(0, dur);
    } else if (t.estimatedMinutes) {
      plannedMinutes += t.estimatedMinutes;
    }
  }

  const capacity = settings.defaultDailyCapacityMinutes;
  if (plannedMinutes <= capacity) return [];

  const ratio = plannedMinutes / capacity;
  const severity: PlanningWarningSeverity = ratio > 1.2 ? 'critical' : 'warning';

  return [{
    id: makeId('daily_capacity_exceeded'),
    type: 'daily_capacity_exceeded',
    severity,
    title: 'Day overloaded',
    message: `You planned ${formatMins(plannedMinutes)} today, but your capacity is ${formatMins(capacity)}.`,
    date,
    actionLabel: 'Adjust capacity',
    actionType: 'open_settings',
    dismissible: true,
  }];
}

// ── Task exceeds remaining capacity ──────────────────────────────────────────

export function detectTaskExceedsRemainingCapacity(
  task: Task,
  tasksForDay: Task[],
  settings: UserSettings,
): PlanningWarning[] {
  if (!task.scheduledDate) return [];
  const capacity = settings.defaultDailyCapacityMinutes;

  let alreadyPlanned = 0;
  for (const t of tasksForDay) {
    if (t.id === task.id || t.status === 'completed') continue;
    if (t.startTime && t.endTime) {
      alreadyPlanned += Math.max(0, timeToMinutes(t.endTime) - timeToMinutes(t.startTime));
    } else if (t.estimatedMinutes) {
      alreadyPlanned += t.estimatedMinutes;
    }
  }

  const remaining = capacity - alreadyPlanned;
  const taskMins = task.estimatedMinutes ?? 0;
  if (taskMins <= remaining) return [];

  const severity: PlanningWarningSeverity = remaining <= 0 ? 'critical' : 'warning';

  return [{
    id: makeId('task_exceeds_remaining_capacity'),
    type: 'task_exceeds_remaining_capacity',
    severity,
    title: 'Exceeds remaining capacity',
    message: remaining <= 0
      ? `No capacity remaining today. '${task.title}' (${formatMins(taskMins)}) would exceed your limit.`
      : `'${task.title}' is estimated at ${formatMins(taskMins)}, but only ${formatMins(remaining)} remain today.`,
    taskId: task.id,
    date: task.scheduledDate,
    actionLabel: 'Move task',
    actionType: 'open_task',
    dismissible: true,
  }];
}

// ── Project deadline capacity risk ───────────────────────────────────────────

export function detectProjectDeadlineRisks(
  projects: AppProject[],
  tasks: Task[],
  settings: UserSettings,
): PlanningWarning[] {
  if (!settings.deadlineWarningEnabled) return [];
  const today = todayStr();
  const warnings: PlanningWarning[] = [];

  for (const project of projects) {
    if (project.status !== 'active' || !project.due_date) continue;
    if (project.due_date < today) continue;

    const projectTasks = tasks.filter(
      (t) => t.projectId === project.id && t.status !== 'completed',
    );
    if (projectTasks.length === 0) continue;

    const hasEstimates = projectTasks.some((t) => t.estimatedMinutes > 0);
    if (!hasEstimates) continue;

    const remainingMinutes = projectTasks.reduce(
      (acc, t) => acc + (t.estimatedMinutes ?? 0), 0,
    );

    const workingDays = workingDaysBetween(today, project.due_date, settings.workingDays);
    const availableCapacity = workingDays * settings.defaultDailyCapacityMinutes;

    if (remainingMinutes <= availableCapacity) continue;

    const daysUntilDue = Math.ceil(
      (new Date(project.due_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000,
    );
    const severity: PlanningWarningSeverity = daysUntilDue <= 2 ? 'critical' : 'warning';

    warnings.push({
      id: makeId('project_deadline_capacity_risk'),
      type: 'project_deadline_capacity_risk',
      severity,
      title: 'Deadline capacity risk',
      message: `'${project.name}' has ${formatMins(remainingMinutes)} remaining but only ${formatMins(availableCapacity)} of available capacity before its deadline.`,
      projectId: project.id,
      date: project.due_date,
      actionLabel: 'Open project',
      actionType: 'open_project',
      dismissible: true,
    });
  }
  return warnings;
}

// ── Missing estimate warnings ─────────────────────────────────────────────────

export function detectMissingEstimateWarnings(tasks: Task[]): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];

  for (const task of tasks) {
    if (task.status === 'completed') continue;
    if (task.estimatedMinutes > 0) continue;

    const isScheduled = !!task.scheduledDate;
    const severity: PlanningWarningSeverity = isScheduled ? 'warning' : 'info';

    if (!isScheduled) continue; // Only warn for scheduled tasks

    warnings.push({
      id: makeId('missing_estimate'),
      type: 'missing_estimate',
      severity,
      title: 'Missing estimate',
      message: `'${task.title}' is scheduled but has no time estimate.`,
      taskId: task.id,
      date: task.scheduledDate ?? undefined,
      actionLabel: 'Add estimate',
      actionType: 'open_task',
      dismissible: true,
    });
  }
  return warnings;
}

// ── Outside working hours warnings ───────────────────────────────────────────

export function detectOutsideWorkingHours(tasks: Task[], settings: UserSettings): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  const workStart = timeToMinutes(settings.workdayStartTime);
  const workEnd = timeToMinutes(settings.workdayEndTime);

  for (const task of tasks) {
    if (task.status === 'completed' || !task.scheduledDate) continue;

    if (task.scheduledDate && !isWorkingDay(task.scheduledDate, settings.workingDays)) {
      warnings.push({
        id: makeId('outside_working_hours'),
        type: 'outside_working_hours',
        severity: 'info',
        title: 'Non-working day',
        message: `'${task.title}' is scheduled on a non-working day.`,
        taskId: task.id,
        date: task.scheduledDate,
        actionLabel: 'Move to working day',
        actionType: 'open_task',
        dismissible: true,
      });
      continue;
    }

    if (!task.startTime || !task.endTime) continue;
    const start = timeToMinutes(task.startTime);
    const end = timeToMinutes(task.endTime);

    if (start < workStart || end > workEnd) {
      warnings.push({
        id: makeId('outside_working_hours'),
        type: 'outside_working_hours',
        severity: 'info',
        title: 'Outside working hours',
        message: `'${task.title}' is scheduled outside your working hours (${formatTime12(settings.workdayStartTime)}–${formatTime12(settings.workdayEndTime)}).`,
        taskId: task.id,
        date: task.scheduledDate,
        actionLabel: 'Keep anyway',
        actionType: 'dismiss',
        dismissible: true,
      });
    }
  }
  return warnings;
}

// ── Master aggregator ─────────────────────────────────────────────────────────

export function getPlanningWarnings(input: PlanningWarningInput): PlanningWarning[] {
  const { tasks, projects = [], calendarEvents = [], settings, dateRange } = input;

  const filtered = dateRange
    ? tasks.filter((t) => {
        if (!t.scheduledDate) return true;
        return t.scheduledDate >= dateRange.start && t.scheduledDate <= dateRange.end;
      })
    : tasks;

  const warnings: PlanningWarning[] = [];

  if (settings.overlapWarningEnabled) {
    warnings.push(...detectTaskOverlaps(filtered));
    warnings.push(...detectCalendarOverlaps(filtered, calendarEvents));
  }

  if (settings.capacityWarningEnabled) {
    const dates = new Set(filtered.filter((t) => t.scheduledDate).map((t) => t.scheduledDate!));
    for (const date of dates) {
      warnings.push(...detectDailyCapacityWarnings(filtered, settings, date));
    }
    warnings.push(...detectMissingEstimateWarnings(filtered));
    warnings.push(...detectOutsideWorkingHours(filtered, settings));
  }

  if (settings.deadlineWarningEnabled && projects.length > 0) {
    warnings.push(...detectProjectDeadlineRisks(projects, tasks, settings));
  }

  return warnings;
}
