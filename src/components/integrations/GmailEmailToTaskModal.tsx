import React, { useState } from 'react';
import { X, ExternalLink, Mail } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useToastStore } from '../../store/useToastStore';
import type { ParsedEmail } from '../../integrations/google/types';
import type { Priority } from '../../types';
import { ProjectSelector } from '../projects/ProjectSelector';
import { ContextSelector } from '../contexts/ContextSelector';

interface Props {
  email: ParsedEmail;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'high',   label: 'High',   color: 'text-red-600 bg-red-50 border-red-200' },
];

export function GmailEmailToTaskModal({ email, onClose }: Props) {
  const { addTask, tasks } = useTaskStore();
  const { addToast } = useToastStore();

  const alreadyImported = tasks.some(
    (t) => t.sourceProvider === 'gmail' && t.sourceExternalId === email.id,
  );

  const [title, setTitle] = useState(email.subject);
  const [notes, setNotes] = useState(`From: ${email.from} <${email.fromEmail}>\n\n${email.bodyText}`.slice(0, 500));
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [contextId, setContextId] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      notes,
      priority,
      estimatedMinutes,
      projectId,
      contextId,
      status: 'inbox',
      sourceProvider: 'gmail',
      sourceType: 'email',
      sourceExternalId: email.id,
      sourceUrl: email.url,
      sourceTitle: email.subject,
      sourceMetadata: {
        from: email.from,
        fromEmail: email.fromEmail,
        date: email.date,
        threadId: email.threadId,
      },
    });

    addToast('Task created from email', 'success');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/30 backdrop-blur-sm md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full flex-1 md:flex-none bg-white md:rounded-2xl shadow-modal overflow-hidden md:max-h-[90vh] md:max-w-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-stone-400" />
            <h2 className="text-base font-semibold text-stone-800">Create Task from Email</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Email preview */}
        <div className="mx-4 md:mx-6 mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-600 truncate">{email.subject}</p>
              <p className="text-xs text-stone-400 truncate">{email.from} · {new Date(email.date).toLocaleDateString()}</p>
            </div>
            <a href={email.url} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-accent-500 flex-shrink-0">
              <ExternalLink size={13} />
            </a>
          </div>
          {email.snippet && (
            <p className="text-xs text-stone-400 mt-2 line-clamp-2">{email.snippet}</p>
          )}
        </div>

        {alreadyImported && (
          <div className="mx-4 md:mx-6 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            This email was already imported as a task. You can still create another.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 md:px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <input
            autoFocus
            type="text"
            placeholder="Task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base font-medium text-stone-800 placeholder-stone-300 border-none outline-none bg-transparent"
          />

          <textarea
            placeholder="Notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full text-sm text-stone-600 placeholder-stone-300 border border-stone-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
          />

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPriority(value)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${priority === value ? color : 'text-stone-400 bg-white border-stone-200 hover:border-stone-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Estimated time</label>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEstimatedMinutes(m)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${estimatedMinutes === m ? 'bg-accent-50 border-accent-300 text-accent-700' : 'text-stone-500 bg-white border-stone-200 hover:border-stone-300'}`}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Project</label>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2 block">Context</label>
            <ContextSelector value={contextId} onChange={setContextId} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
