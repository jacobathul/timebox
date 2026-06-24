import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { todayStr, formatDuration } from '../utils/time';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { step: 1, label: 'Review Inbox', desc: 'See all your pending tasks' },
  { step: 2, label: 'Pick Tasks', desc: "Choose what to work on today" },
  { step: 3, label: 'Set Estimates', desc: 'How long will each task take?' },
  { step: 4, label: 'Schedule', desc: 'Drop tasks into your calendar' },
  { step: 5, label: 'Confirm', desc: "Your day is ready!" },
];

export function PlanMyDayFlow() {
  const { tasks, scheduleTask, updateTask } = useTaskStore();
  const navigate = useNavigate();
  const today = todayStr();

  const [step, setStep] = useState<Step>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [startTimes, setStartTimes] = useState<Record<string, string>>({});

  const inboxTasks = tasks.filter((t) => t.status === 'inbox');
  const scheduledToday = tasks.filter((t) => t.scheduledDate === today && t.status === 'scheduled');
  const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));

  function initEstimates(ids: Set<string>) {
    const e: Record<string, number> = {};
    tasks.forEach((t) => { if (ids.has(t.id)) e[t.id] = t.estimatedMinutes; });
    setEstimates(e);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleNext() {
    if (step === 2) initEstimates(selectedIds);
    if (step === 4) {
      selectedTasks.forEach((task) => {
        const dur = estimates[task.id] ?? task.estimatedMinutes;
        const start = startTimes[task.id];
        if (start) scheduleTask(task.id, today, start, dur);
        else updateTask(task.id, { estimatedMinutes: dur });
      });
    }
    setStep((s) => Math.min(5, s + 1) as Step);
  }

  function handleBack() { setStep((s) => Math.max(1, s - 1) as Step); }

  function autoSchedule() {
    let currentMins = 9 * 60;
    const times: Record<string, string> = {};
    selectedTasks.forEach((task) => {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      times[task.id] = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      currentMins += estimates[task.id] ?? task.estimatedMinutes;
    });
    setStartTimes(times);
  }

  const totalSelectedMins = selectedTasks.reduce((acc, t) => acc + (estimates[t.id] ?? t.estimatedMinutes), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      <div className="bg-white border-b border-stone-200 px-8 py-5 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-accent-500" />
            <h1 className="text-lg font-semibold text-stone-800">Plan My Day</h1>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map(({ step: s, label }) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  s === step ? 'bg-accent-500 text-white' : s < step ? 'bg-accent-100 text-accent-600' : 'bg-stone-100 text-stone-400'
                }`}>
                  {s < step ? <CheckCircle2 size={12} /> : <span>{s}</span>}
                  {label}
                </div>
                {s < 5 && <div className="w-6 h-px bg-stone-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto">

          {step === 1 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Your inbox</h2>
              <p className="text-sm text-stone-400 mb-4">
                You have {inboxTasks.length} unscheduled task{inboxTasks.length !== 1 ? 's' : ''}. Review them before planning.
              </p>
              <div className="space-y-2">
                {inboxTasks.length === 0 ? (
                  <div className="text-center py-10 text-stone-400"><p className="text-sm">Inbox is clear! You're all caught up.</p></div>
                ) : inboxTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-card">
                    <div className={`w-1.5 h-full min-h-[20px] rounded-full flex-shrink-0 mt-1 ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{task.title}</p>
                      {task.notes && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{task.notes}</p>}
                    </div>
                    <span className="text-xs text-stone-400 flex-shrink-0">{formatDuration(task.estimatedMinutes)}</span>
                  </div>
                ))}
              </div>
              {scheduledToday.length > 0 && (
                <p className="text-xs text-stone-400 mt-4">+ {scheduledToday.length} task{scheduledToday.length !== 1 ? 's' : ''} already scheduled for today.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">What will you do today?</h2>
              <p className="text-sm text-stone-400 mb-4">Select the tasks you want to tackle today.</p>
              <div className="space-y-2">
                {inboxTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleSelect(task.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all shadow-card ${selectedIds.has(task.id) ? 'bg-accent-50 border-accent-300' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                  >
                    <div className="mt-0.5 flex-shrink-0 text-stone-300">
                      {selectedIds.has(task.id) ? <CheckCircle2 size={16} className="text-accent-500" /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{task.title}</p>
                      {task.notes && <p className="text-xs text-stone-400 mt-0.5 truncate">{task.notes}</p>}
                    </div>
                    <span className="text-xs text-stone-400 flex-shrink-0 mt-0.5">{formatDuration(task.estimatedMinutes)}</span>
                  </button>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                  <Clock size={14} />
                  <span>{selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} · {formatDuration(totalSelectedMins)} total</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Refine your estimates</h2>
              <p className="text-sm text-stone-400 mb-4">How long will each task realistically take?</p>
              <div className="space-y-3">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-stone-200 shadow-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setEstimates((e) => ({ ...e, [task.id]: Math.max(15, (e[task.id] ?? task.estimatedMinutes) - 15) }))} className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-sm font-medium">−</button>
                      <span className="text-sm font-semibold text-stone-700 w-14 text-center">{formatDuration(estimates[task.id] ?? task.estimatedMinutes)}</span>
                      <button onClick={() => setEstimates((e) => ({ ...e, [task.id]: (e[task.id] ?? task.estimatedMinutes) + 15 }))} className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-sm font-medium">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-accent-50 rounded-xl border border-accent-100">
                <p className="text-sm text-accent-700 font-medium">Total: {formatDuration(totalSelectedMins)}</p>
                {totalSelectedMins > 8 * 60 && <p className="text-xs text-amber-600 mt-1">That's over 8 hours — consider trimming your list.</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Set start times</h2>
              <p className="text-sm text-stone-400 mb-4">Assign a start time to each task, or let us auto-schedule them.</p>
              <button onClick={autoSchedule} className="mb-4 px-4 py-2 rounded-xl text-sm font-medium bg-accent-50 text-accent-600 border border-accent-200 hover:bg-accent-100 transition-colors">
                Auto-schedule from 9 AM
              </button>
              <div className="space-y-3">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{task.title}</p>
                      <p className="text-xs text-stone-400">{formatDuration(estimates[task.id] ?? task.estimatedMinutes)}</p>
                    </div>
                    <input
                      type="time"
                      value={startTimes[task.id] ?? ''}
                      onChange={(e) => setStartTimes((s) => ({ ...s, [task.id]: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-accent-500" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">You're all set!</h2>
              <p className="text-sm text-stone-400 mb-6">Your day is planned. {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} scheduled for today.</p>
              <button onClick={() => navigate('/app/today')} className="px-6 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-colors shadow-sm">
                Open Daily Planner
              </button>
            </div>
          )}
        </div>
      </div>

      {step < 5 && (
        <div className="bg-white border-t border-stone-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={handleBack} disabled={step === 1} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft size={16} />Back
          </button>
          <span className="text-xs text-stone-300">Step {step} of 5</span>
          <button onClick={handleNext} disabled={step === 2 && selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 4 ? 'Confirm Plan' : 'Next'}<ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
