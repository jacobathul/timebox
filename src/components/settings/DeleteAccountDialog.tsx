import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

export function DeleteAccountDialog({ onClose }: Props) {
  const { deleteAccount, profile } = useAuthStore();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const PHRASE = 'delete my account';

  async function handleDelete() {
    setError('');
    setLoading(true);
    const { error: err } = await deleteAccount();
    setLoading(false);
    if (err) { setError(err); return; }
    navigate('/login');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h2 className="font-semibold text-stone-800">Delete account</h2>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-stone-600">
            This will permanently delete <strong>{profile?.email}</strong> and all your tasks, projects, and reviews.
            This action cannot be undone.
          </p>

          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">
              Type <strong>{PHRASE}</strong> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
              placeholder={PHRASE}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirm !== PHRASE || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
