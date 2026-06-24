import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useStore } from '../store/useStore';
import {
  todayStr,
  getWeekStart,
  getWeekDays,
  formatDate,
} from '../utils/time';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyView() {
  const { tasks } = useTaskStore();
  const { setSelectedDate, setView } = useStore();
  const today = todayStr();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const weekDays = getWeekDays(weekStart);

  function goToDay(date: string) {
    setSelectedDate(date);
    setView('daily');
  }

  function prevWeek() {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid size={18} className="text-stone-400" />
            <h1 className="text-lg font-semibold text-stone-800">Weekly View</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm text-stone-600 font-medium min-w-[140px] text-center">
              {formatDate(weekDays[0])} – {formatDate(weekDays[6])}
            </span>
            <button onClick={nextWeek} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"><ChevronRight size={18} /></button>
            <button onClick={() => setWeekStart(getWeekStart(today))} className="ml-2 px-3 py-1.5 rounded-xl text-sm text-stone-500 hover:bg-stone-100 transition-colors">
              This week
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
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
