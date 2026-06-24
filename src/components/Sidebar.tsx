import type React from 'react';
import { CalendarDays, LayoutGrid, PlayCircle, Moon, Plus, Settings, LogOut, FolderTree } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDate, todayStr } from '../utils/time';

const NAV_ITEMS: { path: string; label: string; icon: React.ReactNode; shortcut?: string }[] = [
  { path: '/app/today',  label: 'Today',       icon: <CalendarDays size={18} />, shortcut: 'D' },
  { path: '/app/week',   label: 'Week',        icon: <LayoutGrid size={18} /> },
  { path: '/app/plan',   label: 'Plan My Day', icon: <PlayCircle size={18} />,  shortcut: 'P' },
  { path: '/app/review', label: 'End of Day',  icon: <Moon size={18} />,        shortcut: 'R' },
];

export function Sidebar() {
  const { openTaskModal } = useStore();
  const { tasks } = useTaskStore();
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const inboxCount = tasks.filter((t) => t.status === 'inbox').length;
  const today = todayStr();
  const todayLabel = formatDate(today);

  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <span className="font-semibold text-stone-800 tracking-tight text-lg">Timebox</span>
        </div>
        <p className="text-xs text-stone-400 mt-1">{todayLabel}</p>
      </div>

      <div className="px-3 mb-4">
        <button
          onClick={() => openTaskModal()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Task
          <span className="ml-auto text-accent-200 text-xs font-normal">N</span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon, shortcut }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active ? 'bg-accent-50 text-accent-700 font-medium' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
              }`}
            >
              <span className={active ? 'text-accent-500' : 'text-stone-400'}>{icon}</span>
              {label}
              {path === '/app/today' && inboxCount > 0 && (
                <span className="ml-auto bg-accent-100 text-accent-600 text-xs font-semibold rounded-full px-2 py-0.5">{inboxCount}</span>
              )}
              {shortcut && !active && (
                <span className="ml-auto text-stone-300 text-xs">{shortcut}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 mb-1 space-y-0.5">
        <button
          onClick={() => navigate('/app/settings/contexts')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            pathname === '/app/settings/contexts' ? 'bg-accent-50 text-accent-700 font-medium' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
          }`}
        >
          <FolderTree size={16} className={pathname === '/app/settings/contexts' ? 'text-accent-500' : 'text-stone-400'} />
          Contexts
        </button>
        <button
          onClick={() => navigate('/app/settings/account')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            pathname === '/app/settings/account' ? 'bg-accent-50 text-accent-700 font-medium' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
          }`}
        >
          <Settings size={16} className={pathname === '/app/settings/account' ? 'text-accent-500' : 'text-stone-400'} />
          Settings
        </button>
        {user && (
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
          >
            <LogOut size={16} className="text-stone-400" />
            Sign out
          </button>
        )}
      </div>

      <div className="px-5 py-4 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-600 text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-700 truncate">{displayName}</p>
            <p className="text-xs text-stone-400 truncate">{user?.email ?? 'Guest'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
