import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FolderKanban,
  FolderTree,
  PlayCircle,
  Plus,
  Settings,
  Square,
  Moon,
  Clock,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useProjectStore, computeProjectStats } from '../../store/useProjectStore';
import { useContextStore } from '../../store/useContextStore';
import { useTimekeeperStore } from '../../store/useTimekeeperStore';
import { useUiStore } from '../../store/useUiStore';
import type { CommandPaletteItem } from './types';

interface CommandPaletteContextValue {
  isOpen: boolean;
  query: string;
  setQuery: (value: string) => void;
  open: () => void;
  close: () => void;
  activeIndex: number;
  setActiveIndex: (value: number) => void;
  items: CommandPaletteItem[];
  visibleItems: CommandPaletteItem[];
  selectItem: (item: CommandPaletteItem) => void;
  runActiveItem: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return context;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function textMatches(haystack: string, query: string) {
  return normalize(haystack).includes(normalize(query));
}

function scoreMatch(item: CommandPaletteItem, query: string) {
  const q = normalize(query);
  if (!q) return 0;

  const label = normalize(item.label);
  const keywords = (item.keywords ?? []).map(normalize);
  const searchable = [label, item.subtitle ?? '', ...keywords].join(' ').toLowerCase();
  if (!searchable.includes(q)) return -1;

  if (label === q || keywords.includes(q)) return 1000;
  if (label.startsWith(q) || keywords.some((k) => k.startsWith(q))) return 900;
  if (searchable.startsWith(q)) return 800;
  return 500 + Math.max(0, 100 - searchable.indexOf(q));
}

export function getCommandPaletteShortcut() {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  return navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K';
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { openTaskModal } = useStore();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { contexts } = useContextStore();
  const { runningEntry, startTimer, stopRunningTimer } = useTimekeeperStore();
  const { isCommandPaletteOpen, openCommandPalette, closeCommandPalette } = useUiStore();
  const activeTaskId = useStore((s) => s.activeTaskId);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  );
  const runningTask = useMemo(
    () => (runningEntry ? tasks.find((task) => task.id === runningEntry.taskId) ?? null : null),
    [tasks, runningEntry],
  );

  const close = useCallback(() => {
    closeCommandPalette();
    setQuery('');
    setActiveIndex(0);
  }, [closeCommandPalette]);

  const open = useCallback(() => {
    openCommandPalette();
  }, [openCommandPalette]);

  const navigationCommands = useMemo<CommandPaletteItem[]>(
    () => [
      {
        id: 'nav-today',
        type: 'command',
        label: 'Go to Today',
        keywords: ['today', 'calendar', 'planner', 'daily'],
        icon: <CalendarDays size={16} />,
        group: 'Navigation',
        action: () => navigate('/app/today'),
      },
      {
        id: 'nav-inbox',
        type: 'command',
        label: 'Go to Inbox',
        keywords: ['inbox', 'tasks', 'unscheduled'],
        icon: <CalendarDays size={16} />,
        group: 'Navigation',
        action: () => navigate('/app/today'),
      },
      {
        id: 'nav-projects',
        type: 'command',
        label: 'Go to Projects',
        keywords: ['projects', 'work', 'goals'],
        icon: <FolderKanban size={16} />,
        group: 'Navigation',
        action: () => navigate('/app/projects'),
      },
      {
        id: 'nav-week',
        type: 'command',
        label: 'Go to Week',
        keywords: ['week', 'weekly', 'schedule'],
        icon: <CalendarDays size={16} />,
        group: 'Navigation',
        action: () => navigate('/app/week'),
      },
      {
        id: 'nav-review',
        type: 'command',
        label: 'Go to Review',
        keywords: ['review', 'end of day'],
        icon: <Moon size={16} />,
        group: 'Navigation',
        action: () => navigate('/app/review'),
      },
      {
        id: 'nav-settings',
        type: 'command',
        label: 'Go to Settings',
        keywords: ['settings', 'account', 'preferences'],
        icon: <Settings size={16} />,
        group: 'Settings',
        action: () => navigate('/app/settings/account'),
      },
      {
        id: 'nav-contexts',
        type: 'command',
        label: 'Go to Contexts',
        keywords: ['contexts', 'tags', 'categories'],
        icon: <FolderTree size={16} />,
        group: 'Settings',
        action: () => navigate('/app/settings/contexts'),
      },
      {
        id: 'nav-integrations',
        type: 'command',
        label: 'Go to Integrations',
        keywords: ['integrations', 'outlook', 'sync', 'calendar'],
        icon: <Settings size={16} />,
        group: 'Settings',
        action: () => navigate('/app/settings/account'),
      },
    ],
    [navigate],
  );

  const creationCommands = useMemo<CommandPaletteItem[]>(() => {
    const items: CommandPaletteItem[] = [
      {
        id: 'create-task',
        type: 'command',
        label: 'New Task',
        keywords: ['task', 'todo', 'create', 'add', 'new'],
        icon: <Plus size={16} />,
        group: 'Create',
        action: () => openTaskModal(),
      },
      {
        id: 'create-project',
        type: 'command',
        label: 'New Project',
        keywords: ['project', 'create', 'add', 'new', 'goal'],
        icon: <FolderKanban size={16} />,
        group: 'Create',
        action: () => useUiStore.getState().openProjectModal(),
      },
      {
        id: 'create-context',
        type: 'command',
        label: 'New Context',
        keywords: ['context', 'create', 'add', 'new', 'tag'],
        icon: <FolderTree size={16} />,
        group: 'Create',
        action: () => useUiStore.getState().openContextModal(),
      },
    ];

    const timerTask = runningTask ?? currentTask;
    if (timerTask) {
      items.push({
        id: 'log-time-manually',
        type: 'command',
        label: 'Log Time Manually',
        subtitle: timerTask.title,
        keywords: ['time', 'manual', 'log', 'timer', 'timekeeper'],
        icon: <Clock size={16} />,
        group: 'Create',
        action: () => useUiStore.getState().openManualTimeEntry(timerTask.id),
      });
    }

    return items;
  }, [currentTask, openTaskModal, runningTask]);

  const workflowCommands = useMemo<CommandPaletteItem[]>(() => {
    const items: CommandPaletteItem[] = [
      {
        id: 'workflow-plan-day',
        type: 'command',
        label: 'Plan My Day',
        keywords: ['plan', 'schedule', 'today', 'planning'],
        icon: <PlayCircle size={16} />,
        group: 'Workflows',
        action: () => navigate('/app/plan'),
      },
      {
        id: 'workflow-end-review',
        type: 'command',
        label: 'End Day Review',
        keywords: ['review', 'end', 'day', 'evening', 'reflect'],
        icon: <Moon size={16} />,
        group: 'Workflows',
        action: () => navigate('/app/review'),
      },
    ];

    if (currentTask && !runningEntry) {
      items.push({
        id: 'workflow-start-timer',
        type: 'command',
        label: 'Start Current Task Timer',
        subtitle: currentTask.title,
        keywords: ['timer', 'start', 'track', 'timekeeper'],
        icon: <PlayCircle size={16} />,
        group: 'Workflows',
        action: async () => { await startTimer(currentTask.id); },
      });
    }

    if (runningEntry && runningTask) {
      items.push({
        id: 'workflow-stop-timer',
        type: 'command',
        label: 'Stop Running Timer',
        subtitle: runningTask.title,
        keywords: ['timer', 'stop', 'pause', 'timekeeper'],
        icon: <Square size={16} />,
        group: 'Workflows',
        action: async () => { await stopRunningTimer(); },
      });
    }

    return items;
  }, [currentTask, navigate, runningEntry, runningTask, startTimer, stopRunningTimer]);

  const taskResults = useMemo<CommandPaletteItem[]>(() => {
    const q = normalize(query);
    if (!q) return [];

    return tasks
      .map<CommandPaletteItem | null>((task) => {
        const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
        const context = task.contextId ? contexts.find((c) => c.id === task.contextId) : undefined;
        const searchable = [task.title, task.notes, project?.name ?? '', context?.name ?? ''].join(' ');
        if (!textMatches(searchable, q)) return null;

        const subtitleParts = [
          project?.name,
          context?.name,
          task.status === 'completed' ? 'completed' : null,
          task.scheduledDate,
        ].filter(Boolean);

        return {
          id: `task-${task.id}`,
          type: 'task',
          label: task.title,
          subtitle: subtitleParts.join(' · ') || undefined,
          keywords: [task.notes, project?.name ?? '', context?.name ?? ''],
          icon: <CalendarDays size={16} />,
          group: 'Tasks',
          action: () => openTaskModal(task),
        };
      })
      .filter((item): item is CommandPaletteItem => item !== null)
      .sort((a, b) => {
        const aCompleted = a.subtitle?.includes('completed') ? 1 : 0;
        const bCompleted = b.subtitle?.includes('completed') ? 1 : 0;
        return aCompleted - bCompleted;
      });
  }, [contexts, openTaskModal, projects, query, tasks]);

  const projectResults = useMemo<CommandPaletteItem[]>(() => {
    const q = normalize(query);
    if (!q) return [];

    return projects
      .map<CommandPaletteItem | null>((project) => {
        const context = project.context_id
          ? contexts.find((c) => c.id === project.context_id)
          : undefined;
        const stats = computeProjectStats(project, tasks);
        const searchable = [project.name, project.description ?? '', context?.name ?? ''].join(' ');
        if (!textMatches(searchable, q)) return null;

        return {
          id: `project-${project.id}`,
          type: 'project',
          label: project.name,
          subtitle: [
            project.status,
            `${stats.completedTasks}/${stats.totalTasks} done`,
            context?.name,
          ]
            .filter(Boolean)
            .join(' · '),
          keywords: [project.description ?? '', context?.name ?? ''],
          icon: <FolderKanban size={16} />,
          group: 'Projects',
          action: () => navigate(`/app/projects/${project.id}`),
        };
      })
      .filter((item): item is CommandPaletteItem => item !== null);
  }, [contexts, navigate, projects, query, tasks]);

  const contextResults = useMemo<CommandPaletteItem[]>(() => {
    const q = normalize(query);
    if (!q) return [];

    return contexts
      .map<CommandPaletteItem | null>((context) => {
        const path = useContextStore.getState().getPath(context.id);
        const searchable = [context.name, path].join(' ');
        if (!textMatches(searchable, q)) return null;

        return {
          id: `context-${context.id}`,
          type: 'context',
          label: context.name,
          subtitle: path || undefined,
          keywords: [path, context.name],
          icon: <FolderTree size={16} />,
          group: 'Contexts',
          action: () => navigate('/app/settings/contexts'),
        };
      })
      .filter((item): item is CommandPaletteItem => item !== null);
  }, [contexts, navigate, query]);

  const queryCreateTaskItem = useMemo<CommandPaletteItem | null>(() => {
    const q = query.trim();
    if (!q) return null;
    const exactTask = tasks.some((task) => normalize(task.title) === normalize(q));
    if (exactTask) return null;
    return {
      id: 'create-task-from-query',
      type: 'command',
      label: `Create task "${q}"`,
      subtitle: 'Open new task with title pre-filled',
      keywords: ['new task', q],
      icon: <Plus size={16} />,
      group: 'Create',
      action: () => openTaskModal({ title: q }),
    };
  }, [openTaskModal, query, tasks]);

  const items = useMemo(() => {
    const commands = [...navigationCommands, ...creationCommands, ...workflowCommands];

    if (query.trim()) {
      const results = [...taskResults, ...projectResults, ...contextResults];
      if (queryCreateTaskItem) results.push(queryCreateTaskItem);

      return [...commands, ...results]
        .map((item) => ({ item, score: scoreMatch(item, query) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    }

    return commands;
  }, [
    navigationCommands,
    contextResults,
    creationCommands,
    projectResults,
    query,
    queryCreateTaskItem,
    taskResults,
    workflowCommands,
  ]);

  // visibleItems = items that are not disabled
  const visibleItems = useMemo(() => items.filter((item) => !item.disabled), [items]);

  // Reset state on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setActiveIndex(0);
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  // Clamp activeIndex when visibleItems shrinks
  useEffect(() => {
    if (activeIndex >= visibleItems.length && visibleItems.length > 0) {
      setActiveIndex(visibleItems.length - 1);
    }
  }, [activeIndex, visibleItems.length]);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;

      const target = event.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Allow Cmd+K to close when palette is open (even from inside its own input)
      const paletteOpen = useUiStore.getState().isCommandPaletteOpen;
      if (isTyping && !paletteOpen) return;

      // Block when a different modal is open
      const { isProjectModalOpen, isContextModalOpen, manualTimeEntryTaskId } = useUiStore.getState();
      const taskModalOpen = useStore.getState().isTaskModalOpen;
      if (!paletteOpen && (isProjectModalOpen || isContextModalOpen || !!manualTimeEntryTaskId || taskModalOpen)) return;

      event.preventDefault();
      if (paletteOpen) close();
      else open();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, open]);

  const selectItem = useCallback(
    async (item: CommandPaletteItem) => {
      if (item.disabled) return;
      close();
      await item.action();
    },
    [close],
  );

  const runActiveItem = useCallback(() => {
    const item = visibleItems[activeIndex];
    if (!item) return;
    void selectItem(item);
  }, [activeIndex, selectItem, visibleItems]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen: isCommandPaletteOpen,
      query,
      setQuery,
      open,
      close,
      activeIndex,
      setActiveIndex,
      items,
      visibleItems,
      selectItem,
      runActiveItem,
    }),
    [
      activeIndex,
      close,
      isCommandPaletteOpen,
      items,
      open,
      query,
      selectItem,
      visibleItems,
      runActiveItem,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}
