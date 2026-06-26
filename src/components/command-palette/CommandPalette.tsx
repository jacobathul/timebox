import { useEffect } from 'react';
import { useCommandPalette } from './CommandPaletteProvider';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteList } from './CommandPaletteList';

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();

  // Lock body scroll on mobile while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center md:justify-center bg-black/40 backdrop-blur-sm"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Panel — full-screen on mobile, centered card on desktop */}
      <div className="flex w-full flex-col overflow-hidden bg-white md:mx-4 md:max-h-[70vh] md:w-[min(680px,calc(100vw-2rem))] md:rounded-2xl border-t border-stone-200 md:border md:shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
      >
        {/* Search input */}
        <div className="border-b border-stone-100 px-3 py-3 md:px-4 md:py-4">
          <CommandPaletteInput />
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 md:py-3">
          <CommandPaletteList />
        </div>

        {/* Footer: keyboard hints */}
        <div className="hidden md:flex items-center gap-4 border-t border-stone-100 px-4 py-2.5 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center rounded border border-stone-200 px-1.5 py-0.5 font-mono text-[11px] text-stone-400">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center rounded border border-stone-200 px-1.5 py-0.5 font-mono text-[11px] text-stone-400">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex items-center rounded border border-stone-200 px-1.5 py-0.5 font-mono text-[11px] text-stone-400">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
