import { X, Moon, FolderTree, Settings, LogOut, Search, CalendarDays } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';

const DRAWER_ITEMS = [
  { path: '/app/weekly-planning',  label: 'Plan Week',   Icon: CalendarDays },
  { path: '/app/review',            label: 'End of Day', Icon: Moon },
  { path: '/app/settings/contexts', label: 'Contexts',   Icon: FolderTree },
  { path: '/app/settings/account',  label: 'Settings',   Icon: Settings },
  { path: '/app/settings/recurring-tasks', label: 'Recurring', Icon: FolderTree },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, logout } = useAuthStore();
  const { openCommandPalette } = useUiStore();

  const displayName = profile?.displayName ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  function navTo(path: string) {
    navigate(path);
    onClose();
  }

  function openPalette() {
    onClose();
    // Small delay so drawer animates closed before palette opens
    setTimeout(openCommandPalette, 150);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white flex flex-col shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="font-semibold text-stone-800 tracking-tight">Timebox</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Command palette shortcut */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={openPalette}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors min-h-[44px] border border-stone-200"
          >
            <Search size={16} className="text-stone-400" />
            <span className="flex-1 text-left text-stone-400">Command Palette…</span>
            <span className="text-xs text-stone-300">⌘K</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {DRAWER_ITEMS.map(({ path, label, Icon }) => {
            const active = pathname === path;
            return (
              <button
                key={path}
                onClick={() => navTo(path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  active ? 'bg-accent-50 text-accent-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <Icon size={18} className={active ? 'text-accent-500' : 'text-stone-400'} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 border-t border-stone-100 pt-3 pb-3 space-y-0.5">
          {user && (
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors min-h-[44px]"
            >
              <LogOut size={18} className="text-stone-400" />
              Sign out
            </button>
          )}
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-600 text-xs font-semibold">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-stone-700 truncate">{displayName}</p>
                <p className="text-xs text-stone-400 truncate">{user.email ?? 'Guest'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
