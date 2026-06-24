import { useState } from 'react';
import { Upload, ArrowRight, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { taskService } from '../services/task.service';
import { clearGuestStorage } from '../services/migration.service';
import { useToast } from '../store/useToastStore';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onDismiss: () => void;
}

export function MigrationDialog({ tasks, onDismiss }: Props) {
  const { user } = useAuthStore();
  const { fetchTasks } = useTaskStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleMigrate() {
    if (!user) return;
    setLoading(true);
    try {
      await taskService.bulkCreate(tasks, user.id);
      clearGuestStorage();
      await fetchTasks(); // refresh from Supabase
      toast.success(`${tasks.length} task${tasks.length !== 1 ? 's' : ''} imported successfully`);
      onDismiss();
    } catch {
      toast.error('Import failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    clearGuestStorage();
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Upload size={15} className="text-accent-500" />
            </div>
            <h2 className="font-semibold text-stone-800">Import local tasks?</h2>
          </div>
          <button onClick={handleSkip} className="p-1 text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-stone-600">
            We found <strong>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</strong> you created before signing in.
            Would you like to import them into your account?
          </p>

          <div className="bg-stone-50 rounded-xl border border-stone-100 divide-y divide-stone-100 max-h-40 overflow-y-auto">
            {tasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  t.priority === 'high' ? 'bg-red-400' : t.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span className="text-sm text-stone-700 truncate">{t.title}</span>
              </div>
            ))}
            {tasks.length > 6 && (
              <div className="px-3 py-2 text-xs text-stone-400">+{tasks.length - 6} more</div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleMigrate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? 'Importing…' : <>Import tasks <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
