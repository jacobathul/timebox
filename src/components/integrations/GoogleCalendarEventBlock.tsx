import { useState } from 'react';
import { ExternalLink, PlusCircle, MapPin, Users, Calendar } from 'lucide-react';
import type { GoogleCalendarEvent } from '../../types';
import { HOUR_HEIGHT_PX, DAY_START_HOUR } from '../../utils/time';
import { useTaskStore } from '../../store/useTaskStore';
import { useToastStore } from '../../store/useToastStore';

interface Props {
  event: GoogleCalendarEvent;
}

function timeToPixels(time: string): number {
  const date = new Date(time);
  const hours = date.getHours() + date.getMinutes() / 60;
  return (hours - DAY_START_HOUR) * HOUR_HEIGHT_PX;
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function GoogleCalendarEventBlock({ event }: Props) {
  const { addTask, tasks } = useTaskStore();
  const { addToast } = useToastStore();
  const [expanded, setExpanded] = useState(false);

  const startPx = timeToPixels(event.startTime);
  const endPx   = timeToPixels(event.endTime);
  const heightPx = Math.max(endPx - startPx, 24);

  const alreadyImported = tasks.some(
    (t) => t.sourceProvider === 'google_calendar' && t.sourceExternalId === event.providerEventId,
  );

  function handleCreateTask(e: React.MouseEvent) {
    e.stopPropagation();
    const startDate = new Date(event.startTime).toISOString().split('T')[0];
    const startTime = new Date(event.startTime).toTimeString().slice(0, 5);
    const endTime   = new Date(event.endTime).toTimeString().slice(0, 5);
    const durationMs = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    addTask({
      title: event.title,
      notes: [
        event.description,
        event.location ? `📍 ${event.location}` : '',
      ].filter(Boolean).join('\n\n'),
      priority: 'medium',
      estimatedMinutes: durationMinutes || 30,
      status: 'scheduled',
      scheduledDate: startDate,
      startTime,
      endTime,
      sourceProvider: 'google_calendar',
      sourceType: 'calendar_event',
      sourceExternalId: event.providerEventId,
      sourceUrl: event.sourceUrl,
      sourceTitle: event.title,
      sourceMetadata: {
        calendarId: event.calendarId,
        calendarName: event.sourceCalendarName,
        attendees: event.attendees,
      },
    });
    addToast('Task created from calendar event', 'success');
  }

  return (
    <>
      <div
        className="absolute left-0 right-0 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 cursor-pointer hover:bg-blue-100 transition-colors overflow-hidden group"
        style={{ top: startPx, height: heightPx, zIndex: 5 }}
        onClick={() => setExpanded(true)}
      >
        <div className="px-2 py-1 h-full flex flex-col justify-start overflow-hidden">
          <p className="text-xs font-medium truncate leading-tight">{event.title}</p>
          {heightPx >= 36 && (
            <p className="text-xs text-blue-600 truncate leading-tight">
              {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
            </p>
          )}
        </div>
        {/* Quick action: convert to task */}
        {!alreadyImported && (
          <button
            type="button"
            onClick={handleCreateTask}
            className="absolute top-1 right-1 p-0.5 rounded text-blue-400 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all"
            title="Create task from this event"
          >
            <PlusCircle size={13} />
          </button>
        )}
      </div>

      {/* Expanded detail popover */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-modal max-w-sm w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-blue-500 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-stone-800">{event.title}</h3>
              </div>
              {event.sourceUrl && (
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent-500 flex-shrink-0">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            <p className="text-xs text-stone-500">
              {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
            </p>

            {event.location && (
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <MapPin size={12} />{event.location}
              </p>
            )}

            {event.description && (
              <p className="text-xs text-stone-500 whitespace-pre-wrap line-clamp-4">{event.description}</p>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Users size={12} />
                <span>{event.attendees.slice(0, 3).map((a) => a.displayName ?? a.email).join(', ')}
                  {event.attendees.length > 3 ? ` +${event.attendees.length - 3} more` : ''}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {!alreadyImported ? (
                <button
                  type="button"
                  onClick={(e) => { handleCreateTask(e); setExpanded(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                >
                  <PlusCircle size={14} />Create task
                </button>
              ) : (
                <span className="flex-1 text-center text-xs text-stone-400 py-2">Already imported as a task</span>
              )}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
