import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface Props {
  value: string | null;
  onChange: (projectId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function ProjectSelector({ value, onChange, placeholder = 'No project', className = '' }: Props) {
  const projects = useProjectStore((s) => s.projects);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const selected = useMemo(() => (value ? projects.find((p) => p.id === value) : undefined), [value, projects]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? activeProjects.filter((p) => p.name.toLowerCase().includes(q)) : activeProjects;
  }, [activeProjects, query]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const accentColor = selected?.color ?? '#6b7280';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm hover:border-stone-300 transition-colors"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
            <span className="flex-1 text-left text-stone-700 truncate">{selected.name}</span>
            <span onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-0.5 rounded text-stone-300 hover:text-stone-500 cursor-pointer transition-colors">
              <X size={13} />
            </span>
          </>
        ) : (
          <>
            <span className="flex-1 text-left text-stone-400">{placeholder}</span>
            <ChevronDown size={14} className="text-stone-300 flex-shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-stone-200 shadow-dropdown z-50 overflow-hidden">
          <div className="px-3 pt-2 pb-1.5 border-b border-stone-100">
            <input
              autoFocus type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full text-sm text-stone-700 placeholder-stone-400 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button type="button"
              onClick={() => { onChange(null); setOpen(false); setQuery(''); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${value === null ? 'bg-accent-50 text-accent-600' : 'text-stone-500 hover:bg-stone-50'}`}>
              No project
            </button>
            {filtered.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { onChange(p.id); setOpen(false); setQuery(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${p.id === value ? 'bg-accent-50 text-accent-600 font-medium' : 'text-stone-700 hover:bg-stone-50'}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color ?? '#6b7280' }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-stone-400 text-center">No active projects</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
