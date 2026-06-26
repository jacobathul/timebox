import { Search } from 'lucide-react';

interface Props {
  query: string;
}

export function CommandPaletteEmptyState({ query }: Props) {
  return (
    <div className="px-4 py-10 text-center">
      <Search size={18} className="mx-auto text-stone-300" />
      <p className="mt-3 text-sm font-medium text-stone-700">
        No matching commands, tasks, or projects.
      </p>
      {query.trim() && (
        <p className="mt-1 text-xs text-stone-400">
          Try a different search or create a task from the query.
        </p>
      )}
    </div>
  );
}
