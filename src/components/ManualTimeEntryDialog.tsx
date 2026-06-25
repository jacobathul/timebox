import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { useTimekeeperStore } from '../store/useTimekeeperStore';
import { todayStr } from '../utils/time';
import type { TaskTimeEntry } from '../types';

interface Props {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  editEntry?: TaskTimeEntry;
}

function localDateTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ManualTimeEntryDialog({ taskId, taskTitle, onClose, editEntry }: Props) {
  const { createManualTimeEntry, updateTimeEntry, loading } = useTimekeeperStore();

  const isEdit = !!editEntry;

  const [date, setDate] = useState(
    editEntry ? isoToLocalDate(editEntry.startedAt) : todayStr(),
  );
  const [startTime, setStartTime] = useState(
    editEntry ? isoToLocalTime(editEntry.startedAt) : '',
  );
  const [endTime, setEndTime] = useState(
    editEntry?.endedAt ? isoToLocalTime(editEntry.endedAt) : '',
  );
  const [durationHours, setDurationHours] = useState('');
  const [durationMins, setDurationMins] = useState(
    editEntry?.durationMinutes ? String(editEntry.durationMinutes % 60) : '',
  );
  const [notes, setNotes] = useState(editEntry?.notes ?? '');
  const [inputMode, setInputMode] = useState<'startEnd' | 'startDuration'>('startEnd');
  const [error, setError] = useState('');
  const [showLongWarning, setShowLongWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {
    if (editEntry?.durationMinutes) {
      setDurationHours(String(Math.floor(editEntry.durationMinutes / 60)));
      setDurationMins(String(editEntry.durationMinutes % 60));
    }
  }, [editEntry]);

  function calcDurationMinutes(): number | null {
    if (inputMode === 'startEnd') {
      if (!startTime || !endTime) return null;
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(`${date}T${endTime}:00`);
      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
      return mins > 0 ? mins : null;
    } else {
      const h = parseInt(durationHours || '0', 10);
      const m = parseInt(durationMins || '0', 10);
      const total = h * 60 + m;
      return total > 0 ? total : null;
    }
  }

  function calcEndISO(durationMins: number): string {
    if (inputMode === 'startEnd' && endTime) {
      return localDateTimeToISO(date, endTime);
    }
    const start = new Date(`${date}T${startTime}:00`);
    return new Date(start.getTime() + durationMins * 60000).toISOString();
  }

  async function handleSubmit(e: React.FormEvent, confirmed = false) {
    e.preventDefault();
    setError('');

    if (!date) { setError('Date is required.'); return; }

    const durationMinutes = calcDurationMinutes();
    if (!durationMinutes || durationMinutes <= 0) {
      setError('Duration must be greater than 0.');
      return;
    }

    if (inputMode === 'startEnd' && startTime && endTime) {
      if (new Date(`${date}T${endTime}:00`) <= new Date(`${date}T${startTime}:00`)) {
        setError('End time must be after start time.');
        return;
      }
    }

    // Warn if > 12 hours
    if (!confirmed && durationMinutes > 720) {
      setShowLongWarning(true);
      setPendingSubmit(true);
      return;
    }

    // Warn if future date
    const startISO = startTime
      ? localDateTimeToISO(date, startTime)
      : localDateTimeToISO(date, '00:00');
    const now = new Date();
    if (!confirmed && new Date(startISO) > now) {
      setError('Start time is in the future. Are you sure?');
      return;
    }

    const endISO = calcEndISO(durationMinutes);

    if (isEdit && editEntry) {
      await updateTimeEntry(editEntry.id, taskId, {
        startedAt: startISO,
        endedAt: endISO,
        durationMinutes,
        notes: notes || undefined,
      });
    } else {
      await createManualTimeEntry(taskId, {
        startedAt: startISO,
        endedAt: endISO,
        durationMinutes,
        notes: notes || undefined,
      });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-semibold text-stone-800">
              {isEdit ? 'Edit Time Entry' : 'Log Time Manually'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 truncate max-w-xs">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Duration input</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setInputMode('startEnd')}
                className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${inputMode === 'startEnd' ? 'bg-accent-50 border-accent-300 text-accent-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
              >
                Start + End
              </button>
              <button
                type="button"
                onClick={() => setInputMode('startDuration')}
                className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${inputMode === 'startDuration' ? 'bg-accent-50 border-accent-300 text-accent-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
              >
                Start + Duration
              </button>
            </div>

            {inputMode === 'startEnd' ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                  />
                </div>
                <span className="text-stone-300 text-sm mt-5">→</span>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Start time (optional)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 mb-1 block">Hours</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 mb-1 block">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={durationMins}
                      onChange={(e) => setDurationMins(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 placeholder-stone-300 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {showLongWarning && pendingSubmit && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700 font-medium mb-2">
                <Clock size={13} className="inline mr-1" />
                That's more than 12 hours. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowLongWarning(false); setPendingSubmit(false); }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-500"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => { setShowLongWarning(false); setPendingSubmit(false); handleSubmit(e, true); }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
                >
                  Yes, log it
                </button>
              </div>
            </div>
          )}

          {!showLongWarning && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isEdit ? 'Save changes' : 'Log time'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
