import { Download } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuthStore } from '../../store/useAuthStore';

export function DataExportButton() {
  const { tasks, reviews } = useTaskStore();
  const { projects } = useProjectStore();
  const { profile } = useAuthStore();

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { email: profile?.email, displayName: profile?.displayName },
      tasks,
      projects,
      reviews,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timebox-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
    >
      <Download size={15} />
      Export data as JSON
    </button>
  );
}
