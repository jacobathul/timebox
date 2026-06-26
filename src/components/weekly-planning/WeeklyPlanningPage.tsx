import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FolderKanban, Sparkles, Trash2 } from 'lucide-react';
import { useProjectStore, computeProjectStats } from '../../store/useProjectStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useContextStore } from '../../store/useContextStore';
import { useTimekeeperStore } from '../../store/useTimekeeperStore';
import { useWeeklyPlanStore } from '../../store/useWeeklyPlanStore';
import { getWeekStart, getWeekEnd, getWeekDays, formatWeekRange, formatDateFull, formatDuration, todayStr } from '../../utils/time';
import type { AppProjectWithStats, DayPlan, WeeklyPlan, WeeklyPriorityItem } from '../../types';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_LABELS = [
  'Review last week',
  'Set your intention',
  'Choose focus projects',
  'Estimate capacity',
  'Pick tasks',
  'Assign work to days',
  'Confirm plan',
];

function emptyDayPlan(date: string): DayPlan {
  return { date, focusProjectIds: [], focusTaskIds: [], focusContextIds: [], plannedMinutes: 0, notes: '' };
}

function makeDefaultDraft(weekStartDate: string, weekEndDate: string, selectedProjectIds: string[] = []): WeeklyPlanDraft {
  return {
    user_id: '',
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    status: 'draft',
    reflection_last_week: null,
    weekly_intention: null,
    weekly_capacity_minutes: 20 * 60,
    planned_minutes: 0,
    completed_minutes: 0,
    selected_project_ids: selectedProjectIds,
    selected_context_ids: [],
    priority_items: [],
    day_plans: {},
    completed_at: null,
  };
}

function priorityToTaskItem(taskId: string, text: string): WeeklyPriorityItem {
  return { id: taskId, text, type: 'task', taskId, completed: false };
}

function taskItemIds(items: WeeklyPriorityItem[]) {
  return new Set(items.filter((item) => item.type === 'task').map((item) => item.taskId).filter(Boolean) as string[]);
}

function dayPlanMinutes(dayPlans: Record<string, DayPlan>): number {
  return Object.values(dayPlans).reduce((sum, day) => sum + (day.plannedMinutes ?? 0), 0);
}

type WeeklyPlanDraft = Omit<WeeklyPlan, 'id' | 'created_at' | 'updated_at'> & {
  weekly_review_reflection?: string | null;
};

export function WeeklyPlanningStepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1">
      {STEP_LABELS.map((label, index) => {
        const current = (index + 1) as Step;
        const active = current === step;
        const complete = current < step;
        return (
          <div key={label} className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-medium ${active ? 'bg-accent-500 text-white' : complete ? 'bg-accent-100 text-accent-700' : 'bg-stone-100 text-stone-400'}`}>
              {complete ? <CheckCircle2 size={12} className="inline-block mr-1" /> : null}
              {index + 1}. {label}
            </div>
            {current < STEP_LABELS.length && <div className="w-4 h-px bg-stone-200" />}
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyPriorityList({
  items,
  onChange,
}: {
  items: WeeklyPriorityItem[];
  onChange: (items: WeeklyPriorityItem[]) => void;
}) {
  const [draftText, setDraftText] = useState('');
  const [draftType, setDraftType] = useState<WeeklyPriorityItem['type']>('custom');

  function addItem() {
    const text = draftText.trim();
    if (!text) return;
    onChange([{ id: crypto.randomUUID(), text, type: draftType, completed: false }, ...items]);
    setDraftText('');
    setDraftType('custom');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={draftType}
          onChange={(e) => setDraftType(e.target.value as WeeklyPriorityItem['type'])}
          className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-600"
        >
          <option value="custom">Custom</option>
          <option value="project">Project</option>
          <option value="task">Task</option>
          <option value="context">Context</option>
        </select>
        <input
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add a weekly priority"
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-accent-200"
        />
        <button type="button" onClick={addItem} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
          Add
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-stone-400">Add 1-5 priorities for the week.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white">
            <button
              type="button"
              onClick={() => onChange(items.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry))}
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent'}`}
            >
              <CheckCircle2 size={12} />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>{item.text}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wide">{item.type}</p>
            </div>
            <button type="button" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="text-stone-300 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyPlanSummaryCard({ plan, selectedTaskCount, weeklyCapacityMinutes }: { plan: WeeklyPlan; selectedTaskCount: number; weeklyCapacityMinutes: number }) {
  const planned = plan.planned_minutes ?? dayPlanMinutes(plan.day_plans);
  const remaining = Math.max(0, weeklyCapacityMinutes - planned);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-400">Weekly focus</p>
          <h3 className="text-base font-semibold text-stone-800">{plan.weekly_intention ?? 'Set your weekly intention'}</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-600">{plan.status}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-400 text-xs">Capacity</p>
          <p className="font-semibold text-stone-800">{formatDuration(weeklyCapacityMinutes)}</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-400 text-xs">Planned</p>
          <p className="font-semibold text-stone-800">{formatDuration(planned)}</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-400 text-xs">Remaining</p>
          <p className="font-semibold text-stone-800">{formatDuration(remaining)}</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-stone-400 text-xs">Tasks</p>
          <p className="font-semibold text-stone-800">{selectedTaskCount}</p>
        </div>
      </div>
    </div>
  );
}

export function WeeklyPlanCard({ plan, today, todayLabel }: { plan: WeeklyPlan; today: string; todayLabel: string }) {
  const todayPlan = plan.day_plans[today];
  const focus = todayPlan?.focusTaskIds.length
    ? `${todayPlan.focusTaskIds.length} planned task${todayPlan.focusTaskIds.length === 1 ? '' : 's'}`
    : 'No tasks assigned';

  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4 space-y-1.5">
      <p className="text-xs uppercase tracking-wide text-accent-500 font-medium">{todayLabel}</p>
      <p className="text-sm text-stone-700"><span className="font-semibold">This week:</span> {plan.weekly_intention ?? 'Set your weekly intention'}</p>
      <p className="text-sm text-stone-700"><span className="font-semibold">Today:</span> {focus}</p>
    </div>
  );
}

export function WeeklyDayCapacityCard({
  date,
  capacityMinutes,
  plannedMinutes,
  notes,
  onNotesChange,
}: {
  date: string;
  capacityMinutes: number;
  plannedMinutes: number;
  notes?: string;
  onNotesChange: (notes: string) => void;
}) {
  const remaining = capacityMinutes - plannedMinutes;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-800">{formatDateFull(date)}</p>
          <p className="text-xs text-stone-400">{formatDuration(plannedMinutes)} planned of {formatDuration(capacityMinutes)}</p>
        </div>
        <span className={`text-xs font-medium ${remaining < 0 ? 'text-red-500' : 'text-stone-400'}`}>
          {remaining < 0 ? `${formatDuration(Math.abs(remaining))} over` : `${formatDuration(remaining)} left`}
        </span>
      </div>
      <input
        value={notes ?? ''}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Day notes"
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-accent-200"
      />
    </div>
  );
}

export function ReviewLastWeekStep({
  weekStartDate,
  reflection,
  onReflectionChange,
}: {
  weekStartDate: string;
  reflection: string;
  onReflectionChange: (value: string) => void;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const { fetchTimeEntriesForDate } = useTimekeeperStore();
  const [actualTrackedMinutes, setActualTrackedMinutes] = useState<number | null>(null);
  const lastWeekStart = useMemo(() => {
    const d = new Date(weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, [weekStartDate]);
  const lastWeekDays = useMemo(() => getWeekDays(lastWeekStart), [lastWeekStart]);
  const lastWeekTasks = useMemo(
    () => tasks.filter((task) => task.scheduledDate && lastWeekDays.includes(task.scheduledDate)),
    [tasks, lastWeekDays],
  );
  const completedTasks = lastWeekTasks.filter((task) => task.status === 'completed');
  const unfinishedTasks = lastWeekTasks.filter((task) => task.status !== 'completed');
  const plannedMinutes = lastWeekTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

  useEffect(() => {
    let mounted = true;
    Promise.all(lastWeekDays.map((date) => fetchTimeEntriesForDate(date)))
      .then((entries) => {
        if (!mounted) return;
        const minutes = entries.flat().reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
        setActualTrackedMinutes(minutes);
      })
      .catch(() => {
        if (mounted) setActualTrackedMinutes(null);
      });
    return () => {
      mounted = false;
    };
  }, [fetchTimeEntriesForDate, lastWeekDays]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-stone-400">Completed tasks</p>
          {completedTasks.length === 0 ? <p className="text-sm text-stone-400">No completed tasks last week.</p> : completedTasks.map((task) => <p key={task.id} className="text-sm text-stone-700">{task.title}</p>)}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-stone-400">Unfinished tasks</p>
          {unfinishedTasks.length === 0 ? <p className="text-sm text-stone-400">No unfinished tasks from last week.</p> : unfinishedTasks.map((task) => <p key={task.id} className="text-sm text-stone-700">{task.title}</p>)}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">Planned minutes</p>
          <p className="text-base font-semibold text-stone-800">{formatDuration(plannedMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">Actual tracked</p>
          <p className="text-base font-semibold text-stone-800">{actualTrackedMinutes === null ? 'Unavailable' : formatDuration(actualTrackedMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">Summary</p>
          <p className="text-base font-semibold text-stone-800">{completedTasks.length} completed</p>
        </div>
      </div>
      <textarea
        value={reflection}
        onChange={(e) => onReflectionChange(e.target.value)}
        rows={5}
        placeholder="What went well last week? What needs to change this week?"
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent-200"
      />
    </div>
  );
}

export function WeeklyIntentionStep({
  intention,
  onIntentionChange,
  priorities,
  onPrioritiesChange,
}: {
  intention: string;
  onIntentionChange: (value: string) => void;
  priorities: WeeklyPriorityItem[];
  onPrioritiesChange: (items: WeeklyPriorityItem[]) => void;
}) {
  return (
    <div className="space-y-4">
      <textarea
        value={intention}
        onChange={(e) => onIntentionChange(e.target.value)}
        rows={4}
        placeholder="What is the main outcome you want by the end of this week?"
        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent-200"
      />
      <WeeklyPriorityList items={priorities.slice(0, 5)} onChange={onPrioritiesChange} />
    </div>
  );
}

export function SelectWeeklyProjectsStep({
  projects,
  contexts,
  selectedProjectIds,
  selectedContextIds,
  onSelectedProjectsChange,
  onSelectedContextsChange,
}: {
  projects: AppProjectWithStats[];
  contexts: ReturnType<typeof useContextStore.getState>['contexts'];
  selectedProjectIds: string[];
  selectedContextIds: string[];
  onSelectedProjectsChange: (ids: string[]) => void;
  onSelectedContextsChange: (ids: string[]) => void;
}) {
  const activeProjects = projects.filter((project) => project.status === 'active');

  return (
    <div className="space-y-4">
      {activeProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center">
          <FolderKanban size={28} className="mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-medium text-stone-600">You do not have any projects yet.</p>
          <p className="text-xs text-stone-400 mt-1">You can still plan your week using inbox tasks.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeProjects.map((project) => {
            const selected = selectedProjectIds.includes(project.id);
            return (
              <button
                type="button"
                key={project.id}
                onClick={() => onSelectedProjectsChange(selected ? selectedProjectIds.filter((id) => id !== project.id) : [...selectedProjectIds, project.id])}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${selected ? 'border-accent-300 bg-accent-50' : 'border-stone-200 bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: project.color ?? '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-800">{project.name}</h3>
                      <span className="text-xs text-stone-400">{project.progressPercentage}%</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{project.remainingTasks} remaining · {project.context_id ? 'Has context' : 'No context'}</p>
                  </div>
                  <CheckCircle2 size={16} className={selected ? 'text-accent-500' : 'text-stone-300'} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {contexts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-stone-400">Context-only work</p>
          <div className="flex flex-wrap gap-2">
            {contexts.map((context) => {
              const selected = selectedContextIds.includes(context.id);
              return (
                <button
                  type="button"
                  key={context.id}
                  onClick={() => onSelectedContextsChange(selected ? selectedContextIds.filter((id) => id !== context.id) : [...selectedContextIds, context.id])}
                  className={`px-3 py-2 rounded-full border text-sm ${selected ? 'border-accent-300 bg-accent-50 text-accent-700' : 'border-stone-200 bg-white text-stone-600'}`}
                >
                  {context.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyCapacityStep({
  weekDays,
  availabilityByDate,
  dayPlans,
  onAvailabilityChange,
  plannedMinutes,
}: {
  weekDays: string[];
  availabilityByDate: Record<string, number>;
  dayPlans: Record<string, DayPlan>;
  onAvailabilityChange: (next: Record<string, number>) => void;
  plannedMinutes: number;
}) {
  const weeklyCapacity = Object.values(availabilityByDate).reduce((sum, value) => sum + value, 0);
  const remaining = weeklyCapacity - plannedMinutes;

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {weekDays.map((date) => (
          <WeeklyDayCapacityCard
            key={date}
            date={date}
            capacityMinutes={availabilityByDate[date] ?? 0}
            plannedMinutes={dayPlans[date]?.plannedMinutes ?? 0}
            notes={dayPlans[date]?.notes}
            onNotesChange={() => undefined}
          />
        ))}
      </div>
      <div className="grid gap-3">
        {weekDays.map((date) => (
          <div key={date} className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800">{formatDateFull(date)}</p>
              <p className="text-xs text-stone-400">{formatDuration(availabilityByDate[date] ?? 0)} available</p>
            </div>
            <input
              type="number"
              min={0}
              step={15}
              value={availabilityByDate[date] ?? 0}
              onChange={(e) => onAvailabilityChange({ ...availabilityByDate, [date]: Number(e.target.value) || 0 })}
              className="w-24 px-3 py-2 rounded-xl border border-stone-200 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 grid grid-cols-3 gap-3 text-sm">
        <div><p className="text-xs uppercase tracking-wide text-stone-400">Weekly capacity</p><p className="font-semibold text-stone-800">{formatDuration(weeklyCapacity)}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-stone-400">Planned</p><p className="font-semibold text-stone-800">{formatDuration(plannedMinutes)}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-stone-400">Remaining</p><p className={`font-semibold ${remaining < 0 ? 'text-red-500' : 'text-stone-800'}`}>{formatDuration(Math.abs(remaining))}{remaining < 0 ? ' over' : ' left'}</p></div>
      </div>
    </div>
  );
}

export function SelectWeeklyTasksStep({
  selectedTasks,
  onToggleTask,
  projectTasks,
  inboxTasks,
  overdueTasks,
  dueThisWeekTasks,
  weekTitle,
}: {
  selectedTasks: Set<string>;
  onToggleTask: (taskId: string) => void;
  projectTasks: { project: AppProjectWithStats; tasks: ReturnType<typeof useTaskStore.getState>['tasks'] }[];
  inboxTasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  overdueTasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  dueThisWeekTasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  weekTitle: string;
}) {
  const renderTask = (task: ReturnType<typeof useTaskStore.getState>['tasks'][number]) => {
    const checked = selectedTasks.has(task.id);
    return (
      <button
        key={task.id}
        type="button"
        onClick={() => onToggleTask(task.id)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${checked ? 'bg-accent-50 border-accent-300' : 'bg-white border-stone-200'}`}
      >
        <CheckCircle2 size={15} className={checked ? 'text-accent-500' : 'text-stone-300'} />
        <span className="flex-1 min-w-0 text-sm text-stone-700 truncate">{task.title}</span>
        <span className="text-xs text-stone-400">{formatDuration(task.estimatedMinutes)}</span>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-400">{weekTitle}</p>
      <div className="space-y-4">
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-stone-400">Overdue</p>
            <div className="space-y-2">{overdueTasks.map(renderTask)}</div>
          </div>
        )}
        {dueThisWeekTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-stone-400">Due this week</p>
            <div className="space-y-2">{dueThisWeekTasks.map(renderTask)}</div>
          </div>
        )}
        {projectTasks.map(({ project, tasks }) => (
          <div key={project.id} className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-stone-400">{project.name}</p>
            {tasks.length === 0 ? <p className="text-sm text-stone-400">No remaining tasks for this project.</p> : <div className="space-y-2">{tasks.map(renderTask)}</div>}
          </div>
        ))}
        {inboxTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-stone-400">Inbox / No project</p>
            <div className="space-y-2">{inboxTasks.map(renderTask)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function WeeklyDayAssignmentBoard({
  weekDays,
  availabilityByDate,
  dayPlans,
  selectedTasks,
  taskLookup,
  onAssignTask,
  onRemoveTask,
  onDayNotesChange,
}: {
  weekDays: string[];
  availabilityByDate: Record<string, number>;
  dayPlans: Record<string, DayPlan>;
  selectedTasks: Set<string>;
  taskLookup: Map<string, ReturnType<typeof useTaskStore.getState>['tasks'][number]>;
  onAssignTask: (taskId: string, date: string) => void;
  onRemoveTask: (taskId: string, date: string) => void;
  onDayNotesChange: (date: string, notes: string) => void;
}) {
  const unassignedTasks = Array.from(selectedTasks).filter((taskId) => !Object.values(dayPlans).some((day) => day.focusTaskIds.includes(taskId)));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Selected tasks</p>
        {unassignedTasks.length === 0 ? (
          <p className="text-sm text-stone-400">All selected tasks are assigned to days.</p>
        ) : (
          <div className="space-y-2">
            {unassignedTasks.map((taskId) => {
              const task = taskLookup.get(taskId);
              if (!task) return null;
              return (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-stone-200 p-3">
                  <span className="flex-1 min-w-0 text-sm text-stone-700 truncate">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <select defaultValue="" onChange={(e) => e.target.value && onAssignTask(task.id, e.target.value)} className="px-3 py-2 rounded-xl border border-stone-200 text-sm">
                      <option value="">Assign to day</option>
                      {weekDays.map((date) => <option key={date} value={date}>{formatDateFull(date)}</option>)}
                    </select>
                    <span className="text-xs text-stone-400">{formatDuration(task.estimatedMinutes)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {weekDays.map((date) => {
          const day = dayPlans[date] ?? emptyDayPlan(date);
          return (
            <div key={date} className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-800">{formatDateFull(date)}</p>
                <p className="text-xs text-stone-400">{formatDuration(day.plannedMinutes)} planned of {formatDuration(availabilityByDate[date] ?? 0)}</p>
              </div>
              <div className="space-y-2">
                {day.focusTaskIds.length === 0 ? (
                  <p className="text-xs text-stone-400">No tasks assigned.</p>
                ) : (
                  day.focusTaskIds.map((taskId) => {
                    const task = taskLookup.get(taskId);
                    if (!task) return null;
                    return (
                      <div key={task.id} className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
                        <span className="flex-1 min-w-0 text-sm text-stone-700 truncate">{task.title}</span>
                        <button type="button" onClick={() => onRemoveTask(task.id, date)} className="text-stone-300 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <input
                value={day.notes ?? ''}
                onChange={(e) => onDayNotesChange(date, e.target.value)}
                placeholder="Notes"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConfirmWeeklyPlanStep({
  plan,
  availabilityByDate,
  onConfirm,
  onCompleteReview,
  reviewReflection,
  onReviewReflectionChange,
  showReview,
}: {
  plan: WeeklyPlan;
  availabilityByDate: Record<string, number>;
  onConfirm: () => void;
  onCompleteReview: () => void;
  reviewReflection: string;
  onReviewReflectionChange: (value: string) => void;
  showReview: boolean;
}) {
  const planned = plan.planned_minutes ?? dayPlanMinutes(plan.day_plans);
  const weeklyCapacity = Object.values(availabilityByDate).reduce((sum, value) => sum + value, 0);
  const remaining = weeklyCapacity - planned;

  return (
    <div className="space-y-4">
      <WeeklyPlanSummaryCard plan={plan} selectedTaskCount={plan.priority_items.filter((item) => item.type === 'task').length} weeklyCapacityMinutes={weeklyCapacity} />
      {plan.priority_items.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Priorities</p>
          <div className="space-y-2">
            {plan.priority_items.map((item) => <p key={item.id} className="text-sm text-stone-700">{item.text}</p>)}
          </div>
        </div>
      )}
      <div className={`rounded-2xl border p-4 ${remaining < 0 ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}>
        <p className="text-sm font-medium text-stone-800">Planned minutes exceed capacity?</p>
        <p className="text-sm text-stone-500">{remaining < 0 ? 'You are over capacity, but you can still confirm.' : 'Your week fits within the estimated capacity.'}</p>
      </div>
      {showReview && (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">Complete Weekly Review</p>
          <textarea
            value={reviewReflection}
            onChange={(e) => onReviewReflectionChange(e.target.value)}
            rows={4}
            placeholder="What did you learn this week?"
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent-200"
          />
          <button type="button" onClick={onCompleteReview} className="px-4 py-2 rounded-xl bg-stone-800 text-white text-sm font-medium">
            Complete Weekly Review
          </button>
        </div>
      )}
      <button type="button" onClick={onConfirm} className="w-full px-4 py-3 rounded-2xl bg-accent-500 text-white font-semibold">
        Confirm Weekly Plan
      </button>
    </div>
  );
}

export function WeeklyPlanningPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, updateTask } = useTaskStore();
  const projects = useProjectStore((s) => s.projects);
  const contexts = useContextStore((s) => s.contexts);
  const { currentWeeklyPlan, fetchWeeklyPlan, upsertWeeklyPlanForWeek, updateWeeklyPlan, completeWeeklyPlan } = useWeeklyPlanStore();

  const today = todayStr();
  const weekStartDate = searchParams.get('weekStart') ?? getWeekStart(today);
  const weekEndDate = getWeekEnd(weekStartDate);
  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);
  const projectIdFromQuery = searchParams.get('projectId');
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<WeeklyPlanDraft | null>(null);
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, number>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [loadingReview, setLoadingReview] = useState(false);

  const withStats = useMemo(() => projects.map((project) => computeProjectStats(project, tasks)), [projects, tasks]);
  const activeProjects = useMemo(() => withStats.filter((project) => project.status === 'active'), [withStats]);
  const taskLookup = useMemo(() => new Map(tasks.map((task) => [task.id, task] as const)), [tasks]);
  const selectedProjectStats = useMemo(
    () => activeProjects.filter((project) => draft?.selected_project_ids.includes(project.id)),
    [activeProjects, draft?.selected_project_ids],
  );
  const selectedProjectIds = draft?.selected_project_ids ?? [];
  const selectedContextIds = draft?.selected_context_ids ?? [];
  const plan = currentWeeklyPlan ?? (draft ? ({ ...draft, id: 'draft', created_at: '', updated_at: '' } as WeeklyPlan) : null);
  const currentPlannedMinutes = draft ? dayPlanMinutes(draft.day_plans) : 0;
  const weeklyCapacityMinutes = Object.values(availabilityByDate).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    async function ensureDraft() {
      const loaded = await fetchWeeklyPlan(weekStartDate);
      const base = loaded
        ? loaded
        : await upsertWeeklyPlanForWeek(weekStartDate, makeDefaultDraft(weekStartDate, weekEndDate, projectIdFromQuery ? [projectIdFromQuery] : []));

      setDraft(base);
      setAvailabilityByDate(
        weekDays.reduce((acc, date) => {
          acc[date] = base.day_plans[date]?.plannedMinutes ?? 4 * 60;
          return acc;
        }, {} as Record<string, number>),
      );
      setSelectedTaskIds(new Set([
        ...taskItemIds(base.priority_items),
        ...Object.values(base.day_plans).flatMap((day) => day.focusTaskIds),
      ]));
    }

    void ensureDraft();
  }, [fetchWeeklyPlan, projectIdFromQuery, upsertWeeklyPlanForWeek, weekDays, weekEndDate, weekStartDate]);

  const projectTasks = useMemo(() => {
    return selectedProjectStats.map((project) => ({
      project,
      tasks: tasks.filter((task) => task.projectId === project.id && task.status !== 'completed' && !selectedTaskIds.has(task.id)),
    }));
  }, [selectedProjectStats, tasks, selectedTaskIds]);

  const inboxTasks = useMemo(() => tasks.filter((task) => !task.projectId && task.status === 'inbox'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter((task) => task.scheduledDate && task.scheduledDate < today && task.status !== 'completed'), [tasks, today]);
  const dueThisWeekTasks = useMemo(
    () => tasks.filter((task) => task.scheduledDate && task.scheduledDate >= weekStartDate && task.scheduledDate <= weekEndDate && task.status !== 'completed'),
    [tasks, weekStartDate, weekEndDate],
  );
  const selectedTaskItems = useMemo(() => tasks.filter((task) => selectedTaskIds.has(task.id)), [tasks, selectedTaskIds]);

  function persistDraft(next: WeeklyPlanDraft) {
    setDraft(next);
    if (currentWeeklyPlan) {
      void updateWeeklyPlan(currentWeeklyPlan.id, next);
    } else {
      void upsertWeeklyPlanForWeek(weekStartDate, next);
    }
  }

  function updateWeekQuery(nextWeekStart: string) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set('weekStart', nextWeekStart);
      if (projectIdFromQuery) params.set('projectId', projectIdFromQuery);
      return params;
    });
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      const nextItems = (draft?.priority_items ?? []).filter((item) => item.type !== 'task').concat(
        Array.from(next).map((id) => {
          const task = taskLookup.get(id);
          return priorityToTaskItem(id, task?.title ?? id);
        }),
      );
      if (draft) persistDraft({ ...draft, priority_items: nextItems });
      return next;
    });
  }

  function saveStepOne() {
    if (!draft) return;
    persistDraft({ ...draft, reflection_last_week: draft.reflection_last_week });
    setStep(2);
  }

  function saveStepTwo() {
    if (!draft) return;
    persistDraft({ ...draft, weekly_intention: draft.weekly_intention, priority_items: draft.priority_items.slice(0, 5) });
    setStep(3);
  }

  function saveStepThree() {
    if (!draft) return;
    persistDraft({
      ...draft,
      selected_project_ids: selectedProjectIds,
      selected_context_ids: selectedContextIds,
    });
    setStep(4);
  }

  function saveStepFour() {
    if (!draft) return;
    persistDraft({
      ...draft,
      weekly_capacity_minutes: weeklyCapacityMinutes,
      planned_minutes: dayPlanMinutes(draft.day_plans),
    });
    setStep(5);
  }

  function saveStepFive() {
    if (!draft) return;
    const items = [
      ...draft.priority_items.filter((item) => item.type !== 'task'),
      ...selectedTaskItems.map((task) => priorityToTaskItem(task.id, task.title)),
    ];
    persistDraft({ ...draft, priority_items: items });
    setStep(6);
  }

  async function assignTask(taskId: string, date: string) {
    if (!draft || !currentWeeklyPlan) return;
    await useWeeklyPlanStore.getState().assignTaskToDay(taskId, date);
    const next = useWeeklyPlanStore.getState().currentWeeklyPlan;
    if (next) {
      setDraft(next);
    }
  }

  async function removeTask(taskId: string, date: string) {
    if (!draft || !currentWeeklyPlan) return;
    await useWeeklyPlanStore.getState().removeTaskFromDay(taskId, date);
    const next = useWeeklyPlanStore.getState().currentWeeklyPlan;
    if (next) {
      setDraft(next);
    }
  }

  async function confirmPlan() {
    if (!draft || !currentWeeklyPlan) return;
    const next = await updateWeeklyPlan(currentWeeklyPlan.id, {
      ...draft,
      status: 'planned',
      planned_minutes: dayPlanMinutes(draft.day_plans),
      weekly_capacity_minutes: weeklyCapacityMinutes,
    });
    setDraft(next);
    for (const day of Object.values(next.day_plans)) {
      for (const taskId of day.focusTaskIds) {
        updateTask(taskId, { scheduledDate: day.date, status: 'scheduled' });
      }
    }
    setStep(7);
  }

  async function completeReview() {
    if (!draft || !currentWeeklyPlan) return;
    setLoadingReview(true);
    try {
      const next = await completeWeeklyPlan(currentWeeklyPlan.id, draft.weekly_review_reflection ?? draft.reflection_last_week ?? '', dayPlanMinutes(draft.day_plans));
      setDraft(next);
    } finally {
      setLoadingReview(false);
    }
  }

  if (!draft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50">
        <p className="text-sm text-stone-400">Loading weekly planning…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent-500" />
              <div>
                <h1 className="text-lg font-semibold text-stone-800">Plan Your Week</h1>
                <p className="text-sm text-stone-400 hidden sm:block">{formatWeekRange(weekStartDate, weekEndDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateWeekQuery(getWeekStart(new Date(new Date(weekStartDate + 'T00:00:00').getTime() - 7 * 86400000).toISOString().split('T')[0]))} className="p-2 rounded-xl border border-stone-200 text-stone-500">
                <ArrowLeft size={16} />
              </button>
              <button type="button" onClick={() => updateWeekQuery(getWeekStart(today))} className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-600">
                This week
              </button>
              <button type="button" onClick={() => updateWeekQuery(new Date(new Date(weekStartDate + 'T00:00:00').getTime() + 7 * 86400000).toISOString().split('T')[0])} className="p-2 rounded-xl border border-stone-200 text-stone-500">
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => navigate('/app/week')} className="hidden md:inline-flex px-3 py-2 rounded-xl border border-accent-200 bg-accent-50 text-accent-600 text-sm font-medium">
                Week view
              </button>
            </div>
          </div>
          <div className="mt-4">
            <WeeklyPlanningStepper step={step} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {plan && <WeeklyPlanCard plan={plan} today={today} todayLabel="Today’s weekly focus" />}
          {step === 1 && (
            <>
              <ReviewLastWeekStep
                weekStartDate={weekStartDate}
                reflection={draft.reflection_last_week ?? ''}
                onReflectionChange={(value) => setDraft({ ...draft, reflection_last_week: value })}
              />
              <button type="button" onClick={saveStepOne} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <WeeklyIntentionStep
                intention={draft.weekly_intention ?? ''}
                onIntentionChange={(value) => setDraft({ ...draft, weekly_intention: value })}
                priorities={draft.priority_items.filter((item) => item.type !== 'task')}
                onPrioritiesChange={(items) => setDraft({ ...draft, priority_items: items })}
              />
              <button type="button" onClick={saveStepTwo} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <SelectWeeklyProjectsStep
                projects={withStats}
                contexts={contexts}
                selectedProjectIds={selectedProjectIds}
                selectedContextIds={selectedContextIds}
                onSelectedProjectsChange={(ids) => setDraft({ ...draft, selected_project_ids: ids })}
                onSelectedContextsChange={(ids) => setDraft({ ...draft, selected_context_ids: ids })}
              />
              <button type="button" onClick={saveStepThree} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <WeeklyCapacityStep
                weekDays={weekDays}
                availabilityByDate={availabilityByDate}
                dayPlans={draft.day_plans}
                onAvailabilityChange={setAvailabilityByDate}
                plannedMinutes={currentPlannedMinutes}
              />
              <button type="button" onClick={saveStepFour} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <SelectWeeklyTasksStep
                selectedTasks={selectedTaskIds}
                onToggleTask={toggleTask}
                projectTasks={projectTasks}
                inboxTasks={inboxTasks}
                overdueTasks={overdueTasks}
                dueThisWeekTasks={dueThisWeekTasks}
                weekTitle={formatWeekRange(weekStartDate, weekEndDate)}
              />
              <button type="button" onClick={saveStepFive} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </>
          )}

          {step === 6 && (
            <>
              <WeeklyDayAssignmentBoard
                weekDays={weekDays}
                availabilityByDate={availabilityByDate}
                dayPlans={draft.day_plans}
                selectedTasks={selectedTaskIds}
                taskLookup={taskLookup}
                onAssignTask={(taskId, date) => { void assignTask(taskId, date); }}
                onRemoveTask={(taskId, date) => { void removeTask(taskId, date); }}
                onDayNotesChange={(date, notes) => setDraft({ ...draft, day_plans: { ...draft.day_plans, [date]: { ...(draft.day_plans[date] ?? emptyDayPlan(date)), notes } } })}
              />
              <button type="button" onClick={() => setStep(7)} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Review
              </button>
            </>
          )}

          {step === 7 && (
            <ConfirmWeeklyPlanStep
              plan={draft as WeeklyPlan}
              availabilityByDate={availabilityByDate}
              onConfirm={() => { void confirmPlan(); }}
              onCompleteReview={() => { void completeReview(); }}
              reviewReflection={draft.weekly_review_reflection ?? ''}
              onReviewReflectionChange={(value) => setDraft({ ...draft, weekly_review_reflection: value })}
              showReview={draft.status === 'planned' || loadingReview}
            />
          )}

          {step > 1 && step < 7 && (
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as Step)} className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600">
                Back
              </button>
              <button type="button" onClick={() => setStep((current) => Math.min(7, current + 1) as Step)} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {loadingReview && <ConfirmDialog title="Completing review" body="Saving weekly review…" confirmLabel="Okay" onConfirm={() => undefined} onCancel={() => undefined} />}
    </div>
  );
}
