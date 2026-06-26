import { useEffect, useState } from 'react';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useStore } from '../store/useStore';
import { useWeeklyPlanStore } from '../store/useWeeklyPlanStore';
import {
  todayStr,
  getWeekStart,
  getWeekDays,
  formatDate,
  formatDateFull,
} from '../utils/time';
import { WeeklyPlanSummaryCard } from './weekly-planning/WeeklyPlanningPage';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyView() {
  const { tasks } = useTaskStore();
  const { setSelectedDate, setView } = useStore();
  const { ensureRecurringTasksGeneratedThrough } = useRecurringTaskStore();
  const { fetchWeeklyPlan } = useWeeklyPlanStore();
  const currentWeeklyPlan = useWeeklyPlanStore((s) => s.currentWeeklyPlan);
  const navigate = useNavigate();
  const today = todayStr();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [mobileDay, setMobileDay] = useState(today);
  const weekDays = getWeekDays(weekStart);
  const weekEnd = weekDays[6];

  useEffect(() => {
    void ensureRecurringTasksGeneratedThrough(weekEnd);
  }, [weekEnd, ensureRecurringTasksGeneratedThrough]);

  function goToDay(date: string) {
    setSelectedDate(date);
    setView('daily');
  }

  function prevWeek() {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    const newStart = d.toISOString().split('T')[0];
    setWeekStart(newStart);
    setMobileDay(getWeekDays(newStart)[0]);
  }

  function nextWeek() {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const newStart = d.toISOString().split('T')[0];
    setWeekStart(newStart);
    setMobileDay(getWeekDays(newStart)[0]);
  }

  const mobileDayTasks = tasks.filter((t) => t.scheduledDate === mobileDay && t.startTime);
  const mobileDayInbox = tasks.filter((t) => t.scheduledDate === mobileDay && !t.startTime);

  useEffect(() => {
    void fetchWeeklyPlan(weekStart);
  }, [fetchWeeklyPlan, weekStart]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <LayoutGrid size={18} className="text-stone-400 hidden md:block" />
            <h1 className="text-lg font-semibold text-stone-800">Weekly View</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"><ChevronLeft size={18} /></button>
            <span className="text-sm text-stone-600 font-medium min-w-[130px] md:min-w-[140px] text-center">
              {formatDate(weekDays[0])} – {formatDate(weekDays[6])}
            </span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"><ChevronRight size={18} /></button>
            <button onClick={() => { setWeekStart(getWeekStart(today)); setMobileDay(today); }} className="ml-1 px-3 py-1.5 rounded-xl text-sm text-stone-500 hover:bg-stone-100 transition-colors hidden md:block">
              This week
            </button>
            <button onClick={() => navigate('/app/weekly-planning')} className="ml-1 px-3 py-1.5 rounded-xl text-sm bg-accent-50 text-accent-600 hover:bg-accent-100 transition-colors hidden md:block">
              Plan Week
            </button>
          </div>
        </div>
      </div>

      {currentWeeklyPlan?.week_start_date === weekStart && (
        <div className="px-4 md:px-6 py-4">
          <div className="max-w-5xl mx-auto space-y-3">
            <WeeklyPlanSummaryCard
              plan={currentWeeklyPlan}
              selectedTaskCount={currentWeeklyPlan.priority_items.filter((item) => item.type === 'task').length}
              weeklyCapacityMinutes={currentWeeklyPlan.weekly_capacity_minutes ?? 20 * 60}
            />
            <button
              type="button"
              onClick={() => navigate('/app/weekly-planning')}
              className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium"
            >
              Edit Weekly Plan
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile layout: horizontal day strip + single-day task list ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Day strip */}
        <div className="bg-white border-b border-stone-200 flex-shrink-0 overflow-x-auto">
          <div className="flex px-2 py-2 gap-1 min-w-max">
            {weekDays.map((date, idx) => {
              const isSelected = date === mobileDay;
              const isToday = date === today;
              const isPast = date < today;
              const count = tasks.filter((t) => t.scheduledDate === date && t.startTime).length;
              return (
                <button
                  key={date}
                  onClick={() => setMobileDay(date)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[52px] min-h-[64px] justify-center transition-colors ${
                    isSelected
                      ? 'bg-accent-500 text-white'
                      : isToday
                      ? 'bg-accent-50 text-accent-600'
                      : isPast
                      ? 'text-stone-300'
                      : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide">{DAY_LABELS[idx]}</span>
                  <span className="text-lg font-bold leading-none">{new Date(date + 'T00:00:00').getDate()}</span>
                  {count > 0 && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-accent-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Single day detail */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <p className="text-sm font-semibold text-stone-700">{formatDateFull(mobileDay)}</p>

          {mobileDayTasks.length === 0 && mobileDayInbox.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-stone-400">No tasks scheduled</p>
              <button
                onClick={() => goToDay(mobileDay)}
                className="mt-3 text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors"
              >
                Open day in planner →
              </button>
            </div>
          )}

          {mobileDayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => goToDay(mobileDay)}
              className={`flex items-center gap-3 p-3 rounded-xl border bg-white cursor-pointer active:opacity-70 transition-opacity ${
                task.status === 'completed' ? 'border-stone-100 opacity-60' : 'border-stone-200'
              }`}
            >
              {task.status === 'completed'
                ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                : <Clock size={15} className="text-stone-300 flex-shrink-0" />
              }
              <p className={`text-sm flex-1 min-w-0 truncate ${task.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                {task.title}
              </p>
              <span className="text-xs text-stone-400 flex-shrink-0">{task.startTime}</span>
            </div>
          ))}

          {mobileDayTasks.length > 0 && (
            <button
              onClick={() => goToDay(mobileDay)}
              className="w-full py-2.5 text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors text-center"
            >
              Open in Daily Planner →
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop layout: 7-column grid ── */}
      <div className="hidden md:block flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-7 gap-3 h-full min-h-[500px]">
          {weekDays.map((date, idx) => {
            const dayTasks = tasks.filter((t) => t.scheduledDate === date && t.startTime);
            const completed = dayTasks.filter((t) => t.status === 'completed');
            const isToday = date === today;
            const isPast = date < today;

            return (
              <div
                key={date}
                className={`flex flex-col rounded-2xl border transition-all cursor-pointer group ${
                  isToday ? 'border-accent-300 bg-accent-50 shadow-card'
                  : isPast ? 'border-stone-100 bg-stone-50/50'
                  : 'border-stone-200 bg-white shadow-card hover:shadow-card-hover'
                }`}
                onClick={() => goToDay(date)}
              >
                <div className={`px-3 py-3 border-b ${isToday ? 'border-accent-200' : 'border-stone-100'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isToday ? 'text-accent-500' : 'text-stone-400'}`}>
                    {DAY_LABELS[idx]}
                  </p>
                  <p className={`text-lg font-semibold mt-0.5 ${isToday ? 'text-accent-700' : isPast ? 'text-stone-400' : 'text-stone-800'}`}>
                    {new Date(date + 'T00:00:00').getDate()}
                  </p>
                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-stone-300" />
                      <span className="text-xs text-stone-400">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
                  {dayTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium truncate ${
                      task.status === 'completed' ? 'bg-stone-100 text-stone-400 line-through'
                      : task.priority === 'high' ? 'bg-red-50 text-red-600'
                      : task.priority === 'medium' ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 size={10} className="flex-shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 5 && <p className="text-xs text-stone-300 pl-1">+{dayTasks.length - 5} more</p>}
                  {dayTasks.length === 0 && (
                    <p className={`text-xs text-center pt-4 ${isPast ? 'text-stone-200' : 'text-stone-300 group-hover:text-stone-400'}`}>
                      {isPast ? '—' : 'No tasks'}
                    </p>
                  )}
                </div>

                {dayTasks.length > 0 && (
                  <div className="px-3 pb-3">
                    <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-300 rounded-full transition-all" style={{ width: `${(completed.length / dayTasks.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
