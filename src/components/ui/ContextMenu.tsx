import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x, y });

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let ax = x;
    let ay = y;
    if (ax + rect.width > vw - 8) ax = vw - rect.width - 8;
    if (ay + rect.height > vh - 8) ay = vh - rect.height - 8;
    if (ax < 8) ax = 8;
    if (ay < 8) ay = 8;
    setPos({ x: ax, y: ay });
  }, [x, y]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9000 }}
      className="bg-white rounded-xl border border-stone-200 shadow-modal py-1 min-w-[200px]"
    >
      {children}
    </div>,
    document.body,
  );
}

export function ContextMenuItem({
  icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left
        ${
          disabled
            ? 'text-stone-300 cursor-not-allowed'
            : destructive
              ? 'text-red-500 hover:bg-red-50'
              : 'text-stone-600 hover:bg-stone-50'
        }`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
}

export function ContextMenuDivider() {
  return <div className="my-1 border-t border-stone-100" />;
}

export function ContextMenuSubmenu({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        role="menuitem"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors text-left"
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1">{label}</span>
        <ChevronRight
          size={13}
          className={`text-stone-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="bg-stone-50/80 border-t border-b border-stone-100 py-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
