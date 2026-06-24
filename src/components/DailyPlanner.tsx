import React, { useRef, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useStore } from '../store/useStore';
import { TaskInbox } from './TaskInbox';
import { ScheduledTaskBlock } from './ScheduledTaskBlock';
import { TaskCard } from './TaskCard';
import {
  getHourLabels,
  HOUR_HEIGHT_PX,
  DAY_START_HOUR,
  DAY_END_HOUR,
  pixelsToTime,
  detectOverlaps,
  formatDateFull,
  todayStr,
} from '../utils/time';
import type { Task } from '../types';

const HOURS = getHourLabels();
const CALENDAR_HEIGHT = HOUR_HEIGHT_PX * (DAY_END_HOUR - DAY_START_HOUR + 1);

function CalendarDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'calendar-drop' });
  return (
    <div ref={setNodeRef} className={`relative w-full transition-colors ${isOver ? 'bg-accent-50/50' : ''}`} style={{ height: CALENDAR_HEIGHT }}>
      {children}
    </div>
  );
}

function CurrentTimeIndicator({ date }: { date: string }) {
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    function update() {
      if (date !== todayStr()) { setTop(null); return; }
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes() - DAY_START_HOUR * 60;
      if (mins < 0 || mins > (DAY_END_HOUR - DAY_START_HOUR + 1) * 60) { setTop(null); return; }
      setTop((mins / 60) * HOUR_HEIGHT_PX);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [date]);
  if (top === null) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-full bg-accent-500 flex-shrink-0 -ml-1.5" />
        <div className="flex-1 h-px bg-accent-500" />
      </div>
    </div>
  );
}

export function DailyPlanner() {
  const { tasks, scheduleTask, moveTask, resizeTask } = useTaskStore();
  const { selectedDate, setSelectedDate, openTaskModal } = useStore();

  const calendarRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const resizeRef = useRef<{ taskId: string; startY: number; startEndTime: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const todayScheduled = tasks.filter((t) => t.scheduledDate === selectedDate && t.startTime);
  const overlapWarnings = detectOverlaps(tasks.filter((t) => t.scheduledDate === selectedDate));
  const overlapIds = new Set(overlapWarnings.flatMap((w) => [w.taskA, w.taskB]));
  const totalMins = todayScheduled.reduce((acc, t) => {
    if (!t.startTime || !t.endTime) return acc;
    const [sh, sm] = t.startTime.split(':').map(Number);
    const [eh, em] = t.endTime.split(':').map(Number);
    return acc + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);

  function getTimeAtY(clientY: number): string {
    const rect = calendarRef.current?.getBoundingClientRect();
    if (!rect) return `${String(DAY_START_HOUR).padStart(2, '0')}:00`;
    const offsetY = clientY - rect.top + (calendarRef.current?.scrollTop ?? 0);
    return pixelsToTime(offsetY);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const data = active.data.current as { taskId: string };
    setDraggedTask(tasks.find((t) => t.id === data.taskId) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggedTask(null);
    if (!over || over.id !== 'calendar-drop') return;
    const data = active.data.current as { type: string; taskId: string; source: string };
    if (data.type !== 'task') return;
    const task = tasks.find((t) => t.id === data.taskId);
    if (!task) return;
    const activeRect = active.rect.current.translated;
    if (!activeRect) return;
    const dropTime = getTimeAtY(activeRect.top + activeRect.height / 2);
    if (data.source === 'inbox') scheduleTask(task.id, selectedDate, dropTime, task.estimatedMinutes);
    else moveTask(task.id, dropTime);
  }

  function handleResizeStart(taskId: string, e: React.MouseEvent) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.endTime) return;
    resizeRef.current = { taskId, startY: e.clientY, startEndTime: task.endTime };
    function onMove(ev: MouseEvent) {
      if (!resizeRef.current) return;
      const deltaY = ev.clientY - resizeRef.current.startY;
      const deltaMins = Math.round((deltaY / HOUR_HEIGHT_PX) * 60 / 15) * 15;
      const [bh, bm] = resizeRef.current.startEndTime.split(':').map(Number);
      const baseEndMins = bh * 60 + bm;
      const newMins = Math.max(baseEndMins + 15, baseEndMins + deltaMins);
      const h = Math.floor(newMins / 60) % 24;
      const m = newMins % 60;
      resizeTask(resizeRef.current.taskId, `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
    function onUp() {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleCalendarClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-task-block]')) return;
    openTaskModal({ scheduledDate: selectedDate, startTime: getTimeAtY(e.clientY), status: 'scheduled' });
  }

  function navigateDay(dir: -1 | 1) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  const isToday = selectedDate === todayStr();

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full overflow-hidden">
        {/* Inbox */}
        <div className="w-72 flex-shrink-0 border-r border-stone-200 bg-white overflow-hidden flex flex-col">
          <TaskInbox />
        </div>

        {/* Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={() => navigateDay(-1)} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={() => navigateDay(1)} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"><ChevronRight size={18} /></button>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-stone-800 leading-tight">{formatDateFull(selectedDate)}</h1>
                {isToday && <span className="text-xs text-accent-500 font-medium">Today</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {overlapWarnings.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                  <AlertTriangle size={13} />{overlapWarnings.length} overlap{overlapWarnings.length > 1 ? 's' : ''}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-stone-400">
                <Clock size={14} />
                <span>{Math.floor(totalMins / 60)}h {totalMins % 60 > 0 ? `${totalMins % 60}m` : ''} planned</span>
              </div>
              {!isToday && (
                <button onClick={() => setSelectedDate(todayStr())} className="px-3 py-1.5 rounded-xl text-sm font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 transition-colors">
                  Today
                </button>
              )}
            </div>
          </div>

          <div ref={calendarRef} className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="flex">
              <div className="w-16 flex-shrink-0 select-none">
                {HOURS.map(({ hour, label }) => (
                  <div key={hour} className="flex items-start justify-end pr-3" style={{ height: HOUR_HEIGHT_PX }}>
                    <span className="text-xs text-stone-300 -mt-2">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 relative border-l border-stone-200 mr-4">
                {HOURS.map(({ hour }) => (
                  <div key={hour} className="absolute left-0 right-0 border-t border-stone-100" style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX }} />
                ))}
                {HOURS.map(({ hour }) => (
                  <div key={`h-${hour}`} className="absolute left-0 right-0 border-t border-stone-50 border-dashed" style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2 }} />
                ))}
                <CurrentTimeIndicator date={selectedDate} />

                <CalendarDropZone>
                  {todayScheduled.map((task) => (
                    <div key={task.id} data-task-block>
                      <ScheduledTaskBlock task={task} hasOverlap={overlapIds.has(task.id)} onResizeStart={handleResizeStart} />
                    </div>
                  ))}
                  <div className="absolute inset-0 z-0" onClick={handleCalendarClick} />
                </CalendarDropZone>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedTask && (
          <div className="w-48 opacity-90 pointer-events-none">
            <TaskCard task={draggedTask} compact showActions={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
