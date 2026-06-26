import type { CommandPaletteItem as CommandPaletteItemType } from './types';

interface Props {
  item: CommandPaletteItemType;
  selected: boolean;
  onSelect: (item: CommandPaletteItemType) => void;
}

export function CommandPaletteItem({ item, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={item.disabled}
      onClick={() => onSelect(item)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors rounded-xl ${
        selected ? 'bg-accent-50 text-stone-900' : 'text-stone-700 hover:bg-stone-50'
      } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${item.destructive ? 'text-red-500' : selected ? 'text-accent-600' : 'text-stone-400'}`}>
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium truncate">{item.label}</span>
        {item.subtitle && (
          <span className="block text-xs text-stone-400 mt-0.5 truncate">{item.subtitle}</span>
        )}
      </span>
      {item.disabled && (
        <span className="flex-shrink-0 text-xs text-stone-400 mt-0.5">Unavailable</span>
      )}
    </button>
  );
}
