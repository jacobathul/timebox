import { Menu, Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useUiStore } from '../store/useUiStore';

const PAGE_TITLES: Record<string, string> = {
  '/app/today':             'Today',
  '/app/projects':          'Projects',
  '/app/week':              'Week',
  '/app/weekly-planning':   'Plan Your Week',
  '/app/plan':              'Plan My Day',
  '/app/review':            'End of Day',
  '/app/settings/account':  'Settings',
  '/app/settings/contexts': 'Contexts',
  '/app/settings/recurring-tasks': 'Recurring Tasks',
  '/app/settings':          'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/app/projects/')) return 'Project';
  return 'Timebox';
}

interface Props {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: Props) {
  const { pathname } = useLocation();
  const { openTaskModal } = useStore();
  const { openCommandPalette } = useUiStore();
  const title = getPageTitle(pathname);

  return (
    <header
      className="flex md:hidden flex-col flex-shrink-0 bg-white border-b border-stone-200"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center px-3 py-3 gap-2">
        <button
          onClick={onMenuOpen}
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="flex-1 font-semibold text-stone-800 text-base">Timebox</span>
        <button
          onClick={openCommandPalette}
          className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open command palette"
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => openTaskModal()}
          className="p-2 rounded-xl bg-accent-500 text-white hover:bg-accent-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="New task"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="px-4 pb-2.5">
        <h1 className="text-lg font-semibold text-stone-800 leading-tight">{title}</h1>
      </div>
    </header>
  );
}
