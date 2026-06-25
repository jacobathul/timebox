import React, { useState, useMemo } from 'react';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Sparkles, Clock, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { todayStr, formatDuration } from '../utils/time';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { step: 1, label: 'Pick Projects' },
  { step: 2, label: 'Pick Tasks' },
  { step: 3, label: 'Estimates' },
  { step: 4, label: 'Schedule' },
  { step: 5, label: 'Done' },
];

export function PlanMyDayFlow() {
  const { tasks, scheduleTask, updateTask } = useTaskStore();
  const projects = useProjectStore((s) => s.projects);
  const navigate = useNavigate();
  const today = todayStr();

  const [step, setStep] = useState<Step>(1);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [estimates, setEstimates] = useState<Record<string, number>>({});
  const [startTimes, setStartTimes] = useState<Record<string, string>>({});

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);

  const remainingByProject = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    for (const pid of selectedProjectIds) {
      map[pid] = tasks.filter((t) => t.projectId === pid && t.status !== 'completed');
    }
    return map;
  }, [tasks, selectedProjectIds]);

  const inboxTasks = useMemo(() => tasks.filter((t) => !t.projectId && t.status === 'inbox'), [tasks]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => selectedTaskIds.has(t.id)),
    [tasks, selectedTaskIds],
  );

  const totalSelectedMins = useMemo(
    () => selectedTasks.reduce((acc, t) => acc + (estimates[t.id] ?? t.estimatedMinutes), 0),
    [selectedTasks, estimates],
  );

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function initEstimates(ids: Set<string>) {
    const e: Record<string, number> = {};
    tasks.forEach((t) => { if (ids.has(t.id)) e[t.id] = t.estimatedMinutes; });
    setEstimates(e);
  }

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

  function handleNext() {
    if (step === 2) initEstimates(selectedTaskIds);
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      {/* Progress header */}
      <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-4 md:py-5 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-accent-500" />
            <h1 className="text-lg font-semibold text-stone-800">Plan My Day</h1>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1">
            {STEPS.map(({ step: s, label }) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  s === step ? 'bg-accent-500 text-white' : s < step ? 'bg-accent-100 text-accent-600' : 'bg-stone-100 text-stone-400'
                }`}>
                  {s < step ? <CheckCircle2 size={12} /> : <span>{s}</span>}
                  {label}
                </div>
                {s < 5 && <div className="w-4 h-px bg-stone-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-2xl mx-auto">

          {/* Step 1: Pick Projects */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Which projects will you work on today?</h2>
              <p className="text-sm text-stone-400 mb-4">Select one or more active projects. You'll then pick specific tasks from them.</p>
              {activeProjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl">
                  <FolderKanban size={28} className="mx-auto text-stone-300 mb-3" />
                  <p className="text-sm text-stone-500 font-medium">No active projects</p>
                  <p className="text-xs text-stone-400 mt-1 mb-4">Create a project first to plan project-based tasks.</p>
                  <button onClick={() => navigate('/app/projects')} className="text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors">
                    Go to Projects →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeProjects.map((p) => {
                    const taskCount = tasks.filter((t) => t.projectId === p.id && t.status !== 'completed').length;
                    const selected = selectedProjectIds.has(p.id);
                    return (
                      <button key={p.id} onClick={() => toggleProject(p.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all shadow-card ${selected ? 'bg-accent-50 border-accent-300' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color ?? '#6b7280' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{p.name}</p>
                          {p.description && <p className="text-xs text-stone-400 mt-0.5 truncate">{p.description}</p>}
                        </div>
                        <span className="text-xs text-stone-400 flex-shrink-0">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                        <div className="flex-shrink-0 text-stone-300">
                          {selected ? <CheckCircle2 size={16} className="text-accent-500" /> : <Circle size={16} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pick Tasks */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Which tasks will you tackle?</h2>
              <p className="text-sm text-stone-400 mb-4">Pick specific tasks from your selected projects.</p>
              <div className="space-y-5">
                {Array.from(selectedProjectIds).map((pid) => {
                  const p = projects.find((x) => x.id === pid);
                  const pTasks = remainingByProject[pid] ?? [];
                  if (!p) return null;
                  return (
                    <div key={pid}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color ?? '#6b7280' }} />
                        <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{p.name}</h3>
                      </div>
                      {pTasks.length === 0 ? (
                        <p className="text-sm text-stone-400 pl-4 py-2">No remaining tasks in this project.</p>
                      ) : (
                        <div className="space-y-1.5 pl-4">
                          {pTasks.map((task) => {
                            const sel = selectedTaskIds.has(task.id);
                            return (
                              <button key={task.id} onClick={() => toggleTask(task.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${sel ? 'bg-accent-50 border-accent-300' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
                                <div className="flex-shrink-0 text-stone-300">
                                  {sel ? <CheckCircle2 size={15} className="text-accent-500" /> : <Circle size={15} />}
                                </div>
                                <span className="flex-1 text-sm text-stone-700 truncate">{task.title}</span>
                                <span className="text-xs text-stone-400 flex-shrink-0">{formatDuration(task.estimatedMinutes)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inbox tasks (no project) */}
                {inboxTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Inbox (no project)</h3>
                    <div className="space-y-1.5">
                      {inboxTasks.map((task) => {
                        const sel = selectedTaskIds.has(task.id);
                        return (
                          <button key={task.id} onClick={() => toggleTask(task.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${sel ? 'bg-accent-50 border-accent-300' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
                            <div className="flex-shrink-0 text-stone-300">
                              {sel ? <CheckCircle2 size={15} className="text-accent-500" /> : <Circle size={15} />}
                            </div>
                            <span className="flex-1 text-sm text-stone-700 truncate">{task.title}</span>
                            <span className="text-xs text-stone-400 flex-shrink-0">{formatDuration(task.estimatedMinutes)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {selectedTaskIds.size > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                  <Clock size={14} />
                  <span>{selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} · {formatDuration(totalSelectedMins)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Estimates */}
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
                      <button onClick={() => setEstimates((e) => ({ ...e, [task.id]: Math.max(15, (e[task.id] ?? task.estimatedMinutes) - 15) }))}
                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-sm font-medium">−</button>
                      <span className="text-sm font-semibold text-stone-700 w-14 text-center">{formatDuration(estimates[task.id] ?? task.estimatedMinutes)}</span>
                      <button onClick={() => setEstimates((e) => ({ ...e, [task.id]: (e[task.id] ?? task.estimatedMinutes) + 15 }))}
                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-sm font-medium">+</button>
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

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div>
              <h2 className="text-base font-semibold text-stone-700 mb-1">Set start times</h2>
              <p className="text-sm text-stone-400 mb-4">Assign a start time to each task, or auto-schedule them from 9 AM.</p>
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

          {/* Step 5: Done */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-accent-500" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">You're all set!</h2>
              <p className="text-sm text-stone-400 mb-6">
                {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} from {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} scheduled for today.
              </p>
              <button onClick={() => navigate('/app/today')} className="px-6 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-colors shadow-sm">
                Open Daily Planner
              </button>
            </div>
          )}
        </div>
      </div>

      {step < 5 && (
        <div className="bg-white border-t border-stone-200 px-4 md:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={handleBack} disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-xs text-stone-300">Step {step} of 5</span>
          <button onClick={handleNext}
            disabled={(step === 1 && selectedProjectIds.size === 0) || (step === 2 && selectedTaskIds.size === 0)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 4 ? 'Confirm Plan' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
