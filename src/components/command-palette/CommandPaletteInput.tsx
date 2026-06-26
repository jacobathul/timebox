import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useCommandPalette } from './CommandPaletteProvider';

export function CommandPaletteInput() {
  const { query, setQuery, isOpen, runActiveItem, close, setActiveIndex, visibleItems, activeIndex } =
    useCommandPalette();
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [isOpen]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(Math.min(activeIndex + 1, Math.max(visibleItems.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runActiveItem();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
      />
      <input
        ref={ref}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search commands, tasks, projects…"
        className="w-full pl-10 pr-4 py-3.5 text-sm md:text-base rounded-2xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
}
