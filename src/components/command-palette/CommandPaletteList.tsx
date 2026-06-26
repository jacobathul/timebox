import { useMemo } from 'react';
import { CommandPaletteGroup } from './CommandPaletteGroup';
import { CommandPaletteEmptyState } from './CommandPaletteEmptyState';
import { useCommandPalette } from './CommandPaletteProvider';
import type { CommandPaletteGroup as CommandPaletteGroupName, CommandPaletteItem } from './types';

const GROUP_ORDER: CommandPaletteGroupName[] = [
  'Navigation',
  'Create',
  'Workflows',
  'Tasks',
  'Projects',
  'Contexts',
  'Settings',
];

export function CommandPaletteList() {
  const { query, visibleItems, activeIndex, selectItem } = useCommandPalette();

  const grouped = useMemo(() => {
    const map = new Map<CommandPaletteGroupName, CommandPaletteItem[]>();
    GROUP_ORDER.forEach((group) => map.set(group, []));
    visibleItems.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return GROUP_ORDER.map((group) => ({ group, items: map.get(group) ?? [] })).filter(
      ({ items }) => items.length > 0,
    );
  }, [visibleItems]);

  if (visibleItems.length === 0) {
    return <CommandPaletteEmptyState query={query} />;
  }

  let startIndex = 0;

  return (
    <div className="space-y-4" role="listbox" aria-label="Commands">
      {grouped.map(({ group, items: groupItems }) => {
        const currentStart = startIndex;
        startIndex += groupItems.length;
        return (
          <CommandPaletteGroup
            key={group}
            label={group}
            items={groupItems}
            selectedIndex={activeIndex}
            startIndex={currentStart}
            onSelect={selectItem}
          />
        );
      })}
    </div>
  );
}
