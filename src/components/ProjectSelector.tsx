import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  value: string | null;
  onChange: (projectId: string | null) => void;
  className?: string;
}

export function ProjectSelector({ value, onChange, className = '' }: Props) {
  const { projects } = useProjectStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = projects.find((p) => p.id === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 hover:border-stone-300 transition-colors"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="truncate max-w-[100px]">{selected.name}</span>
          </>
        ) : (
          <>
            <FolderOpen size={14} className="text-stone-400" />
            <span className="text-stone-400">No project</span>
          </>
        )}
        <ChevronDown size={12} className="text-stone-400 ml-0.5" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-44 bg-white rounded-xl border border-stone-200 shadow-modal py-1">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50"
          >
            <FolderOpen size={14} className="text-stone-300" />
            No project
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { onChange(p.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-stone-50 ${value === p.id ? 'text-stone-900 font-medium' : 'text-stone-600'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
