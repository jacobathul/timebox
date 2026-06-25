import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';
import { useContextStore, buildContextTree, flattenContextTree } from '../../store/useContextStore';
import { ContextFormDialog } from './ContextFormDialog';

interface Props {
  value: string | null;
  onChange: (contextId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function ContextSelector({ value, onChange, placeholder = 'No context', className = '' }: Props) {
  // Subscribe to contexts directly so the component re-renders when contexts change
  const contexts = useContextStore((s) => s.contexts);
  const addContext = useContextStore((s) => s.addContext);

  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const flat = useMemo(() => flattenContextTree(buildContextTree(contexts)), [contexts]);
  const selected = useMemo(() => (value ? contexts.find((c) => c.id === value) : undefined), [value, contexts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? flat.filter((c) => c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q))
      : flat;
  }, [flat, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm hover:border-stone-300 transition-colors"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="flex-1 text-left text-stone-700 truncate">{selected.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-0.5 rounded text-stone-300 hover:text-stone-500 transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-left text-stone-400">{placeholder}</span>
            <ChevronDown size={14} className="text-stone-300 flex-shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-stone-200 shadow-dropdown z-50 overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-2 pb-1.5 border-b border-stone-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contexts…"
              className="w-full text-sm text-stone-700 placeholder-stone-400 outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {/* None option */}
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); setQuery(''); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${value === null ? 'bg-accent-50 text-accent-600' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              No context
            </button>

            {filtered.map((ctx) => (
              <button
                key={ctx.id}
                type="button"
                onClick={() => { onChange(ctx.id); setOpen(false); setQuery(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${ctx.id === value ? 'bg-accent-50 text-accent-600 font-medium' : 'text-stone-700 hover:bg-stone-50'}`}
                style={{ paddingLeft: `${12 + ctx.indent * 16}px` }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ctx.color }} />
                <span className="truncate">{ctx.name}</span>
                {ctx.depth > 1 && (
                  <span className="ml-auto text-xs text-stone-300 truncate">{ctx.path.split(' / ').slice(0, -1).join(' / ')}</span>
                )}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-stone-400 text-center">No contexts yet — create one below</p>
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-stone-100 p-1.5">
            <button
              type="button"
              onClick={() => { setShowCreate(true); setOpen(false); setQuery(''); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
            >
              <Plus size={14} />
              New context
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <ContextFormDialog
          onConfirm={(name, color) => {
            const ctx = addContext(name, color, null);
            if (ctx) onChange(ctx.id);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
