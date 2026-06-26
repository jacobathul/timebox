import type { CommandPaletteItem } from './types';
import { CommandPaletteItem as CommandPaletteItemView } from './CommandPaletteItem';

interface Props {
  label: string;
  items: CommandPaletteItem[];
  selectedIndex: number;
  startIndex: number;
  onSelect: (item: CommandPaletteItem) => void;
}

export function CommandPaletteGroup({ label, items, selectedIndex, startIndex, onSelect }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <CommandPaletteItemView
            key={item.id}
            item={item}
            selected={selectedIndex === startIndex + index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
