import React, { useState } from 'react';
import { Plus, Inbox, Search } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useTaskStore } from '../store/useTaskStore';
import { useStore } from '../store/useStore';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types';

function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `inbox-${task.id}`,
    data: { type: 'task', taskId: task.id, source: 'inbox' },
  });
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard task={task} draggable dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'inbox',     label: 'Inbox' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Done' },
];

export function TaskInbox() {
  const { tasks } = useTaskStore();
  const { openTaskModal } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('inbox');

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Inbox size={16} className="text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-700">Task Inbox</h2>
            {inboxCount > 0 && (
              <span className="text-xs bg-accent-100 text-accent-600 font-semibold rounded-full px-2 py-0.5">{inboxCount}</span>
            )}
          </div>
          <button onClick={() => openTaskModal()} className="p-1.5 rounded-lg text-stone-400 hover:text-accent-500 hover:bg-accent-50 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-100 text-sm text-stone-600 placeholder-stone-300 outline-none focus:ring-2 focus:ring-accent-200 transition-all"
          />
        </div>

        <div className="flex gap-1 mt-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === value ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <Inbox size={20} className="text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-400">{search ? 'No matching tasks' : 'Inbox is clear!'}</p>
            {!search && (
              <button onClick={() => openTaskModal()} className="mt-3 text-sm text-accent-500 hover:text-accent-600 font-medium">
                + Add a task
              </button>
            )}
          </div>
        ) : (
          filtered.map((task) => <DraggableTaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
