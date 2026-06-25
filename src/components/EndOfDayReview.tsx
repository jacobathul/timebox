import { useState, useEffect } from 'react';
import { Moon, CheckCircle2, Clock, RotateCcw, TrendingUp, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { todayStr, formatDateFull, formatDuration } from '../utils/time';
import type { DailyReview, TaskTimeEntry } from '../types';

export function EndOfDayReview() {
  const { tasks, saveReview, getReview, rollTaskToTomorrow } = useTaskStore();
  const { fetchTimeEntriesForDate } = useTimekeeperStore();
  const navigate = useNavigate();
  const today = todayStr();

  const existingReview = getReview(today);

  const completedToday = tasks.filter((t) => t.status === 'completed' && t.scheduledDate === today);
  const unfinishedToday = tasks.filter((t) => t.status === 'scheduled' && t.scheduledDate === today);
  const plannedMins = [...completedToday, ...unfinishedToday].reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const completedMins = completedToday.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  const [reflection, setReflection] = useState(existingReview?.reflection ?? '');
  const [saved, setSaved] = useState(false);
  const [todayEntries, setTodayEntries] = useState<TaskTimeEntry[]>([]);

  useEffect(() => {
    fetchTimeEntriesForDate(today).then(setTodayEntries);
  }, [today, fetchTimeEntriesForDate]);

  const trackedMinsToday = todayEntries.reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0);
  const tasksWithNoTracking = completedToday.filter(
    (t) => !todayEntries.some((e) => e.taskId === t.id),
  );
  const tasksExceededEstimate = completedToday.filter(
    (t) => t.actualMinutes != null && t.actualMinutes > t.estimatedMinutes,
  );

  useEffect(() => {
    setReflection(existingReview?.reflection ?? '');
  }, [existingReview]);

  function handleSave() {
    const review: DailyReview = {
      date: today,
      completedTaskIds: completedToday.map((t) => t.id),
      unfinishedTaskIds: unfinishedToday.map((t) => t.id),
      reflection,
      plannedMinutes: plannedMins,
      completedMinutes: completedMins,
    };
    saveReview(review);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRollAll() {
    unfinishedToday.forEach((t) => rollTaskToTomorrow(t.id));
  }

  const completionRate = plannedMins > 0 ? Math.round((completedMins / plannedMins) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 md:py-5 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Moon size={20} className="text-accent-400" />
          <div>
            <h1 className="text-lg font-semibold text-stone-800">End of Day Review</h1>
            <p className="text-sm text-stone-400">{formatDateFull(today)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-stone-800">{completedToday.length}</p>
              <p className="text-xs text-stone-400 mt-1">Tasks completed</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-stone-800">{formatDuration(completedMins)}</p>
              <p className="text-xs text-stone-400 mt-1">Time completed</p>
            </div>
            <div className={`rounded-2xl border shadow-card p-4 text-center ${completionRate >= 80 ? 'bg-emerald-50 border-emerald-200' : completionRate >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-2xl font-bold ${completionRate >= 80 ? 'text-emerald-700' : completionRate >= 50 ? 'text-amber-700' : 'text-red-700'}`}>{completionRate}%</p>
              <p className="text-xs text-stone-400 mt-1">Completion rate</p>
            </div>
          </div>

          {plannedMins > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                  <TrendingUp size={14} />Planned vs Completed
                </span>
                <span className="text-sm text-stone-400">{formatDuration(completedMins)} / {formatDuration(plannedMins)}</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-400 rounded-full transition-all" style={{ width: `${Math.min(100, completionRate)}%` }} />
              </div>
            </div>
          )}

          {trackedMinsToday > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Timer size={14} className="text-accent-500" />Time Tracked Today
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-stone-800">{formatDuration(plannedMins)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Planned</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-accent-600">{formatDuration(trackedMinsToday)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Tracked</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${trackedMinsToday > plannedMins ? 'text-red-500' : 'text-emerald-600'}`}>
                    {trackedMinsToday > plannedMins
                      ? `+${formatDuration(trackedMinsToday - plannedMins)}`
                      : plannedMins > 0
                        ? `-${formatDuration(plannedMins - trackedMinsToday)}`
                        : '—'
                    }
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">Difference</p>
                </div>
              </div>
              {tasksExceededEstimate.length > 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  {tasksExceededEstimate.length} task{tasksExceededEstimate.length > 1 ? 's' : ''} took longer than estimated.
                </p>
              )}
              {tasksWithNoTracking.length > 0 && (
                <p className="text-xs text-stone-400 mt-1">
                  {tasksWithNoTracking.length} completed task{tasksWithNoTracking.length > 1 ? 's' : ''} had no timer.
                </p>
              )}
            </div>
          )}

          {completedToday.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" />Completed ({completedToday.length})
              </h2>
              <div className="space-y-2">
                {completedToday.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-card opacity-70">
                    <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-stone-600 line-through truncate flex-1">{task.title}</p>
                    <span className="text-xs text-stone-300 flex-shrink-0">{formatDuration(task.estimatedMinutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unfinishedToday.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                  <Clock size={15} className="text-amber-500" />Unfinished ({unfinishedToday.length})
                </h2>
                <button onClick={handleRollAll} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                  <RotateCcw size={12} />Roll all to tomorrow
                </button>
              </div>
              <div className="space-y-2">
                {unfinishedToday.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-card">
                    <Clock size={15} className="text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-stone-700 truncate flex-1">{task.title}</p>
                    <span className="text-xs text-stone-400 flex-shrink-0">{formatDuration(task.estimatedMinutes)}</span>
                    <button onClick={() => rollTaskToTomorrow(task.id)} className="flex items-center gap-1 text-xs text-stone-400 hover:text-accent-500 px-2 py-1 rounded-lg hover:bg-accent-50 transition-colors flex-shrink-0">
                      <RotateCcw size={11} />Tomorrow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">What went well today?</h2>
            <textarea
              placeholder="Reflect on your day... What are you proud of? What could be better?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm text-stone-600 placeholder-stone-300 resize-none outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all shadow-card"
            />
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/app/today')} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
              Back to planner
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : 'bg-accent-500 text-white hover:bg-accent-600'}`}
            >
              {saved ? '✓ Saved!' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
