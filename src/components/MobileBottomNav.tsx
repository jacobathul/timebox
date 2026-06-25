import { CalendarDays, FolderKanban, PlayCircle, LayoutGrid, MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/app/today',    label: 'Today',    Icon: CalendarDays },
  { path: '/app/projects', label: 'Projects', Icon: FolderKanban },
  { path: '/app/plan',     label: 'Plan',     Icon: PlayCircle },
  { path: '/app/week',     label: 'Week',     Icon: LayoutGrid },
];

interface Props {
  onMoreOpen: () => void;
}

export function MobileBottomNav({ onMoreOpen }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] transition-colors ${
                active ? 'text-accent-500' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
        <button
          onClick={onMoreOpen}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] text-stone-400 hover:text-stone-600 transition-colors"
        >
          <MoreHorizontal size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
