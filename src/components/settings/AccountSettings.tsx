import { useState } from 'react';
import { User, Mail, Lock, Trash2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../store/useToastStore';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { DataExportButton } from './DataExportButton';

export function AccountSettings() {
  const { profile, updateProfile, resetPassword } = useAuthStore();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pwResetSent, setPwResetSent] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({ displayName });
    setSaving(false);
    if (error) toast.error('Failed to save changes');
    else toast.success('Profile updated');
  }

  async function handlePasswordReset() {
    if (!profile?.email) return;
    await resetPassword(profile.email);
    setPwResetSent(true);
    toast.success('Password reset email sent');
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800">Account Settings</h1>

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
          <User size={16} className="text-stone-400" />
          <h2 className="text-sm font-semibold text-stone-700">Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block flex items-center gap-1.5">
              <Mail size={12} /> Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl border border-stone-100 bg-stone-50 text-sm text-stone-400 cursor-not-allowed"
            />
            <p className="text-xs text-stone-400 mt-1">Email cannot be changed after signup.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
              placeholder="Your name"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
          <Lock size={16} className="text-stone-400" />
          <h2 className="text-sm font-semibold text-stone-700">Security</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">Password</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {pwResetSent ? 'Reset email sent — check your inbox.' : 'Change your password via email link.'}
              </p>
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={pwResetSent}
              className="flex items-center gap-1 text-sm text-accent-500 hover:text-accent-600 disabled:text-stone-300 font-medium"
            >
              {pwResetSent ? 'Email sent' : 'Change password'}
              {!pwResetSent && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-700">Your data</h2>
        </div>
        <div className="px-5 py-4">
          <DataExportButton />
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2.5">
          <Trash2 size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-700">Delete account</p>
            <p className="text-xs text-stone-400 mt-0.5">Permanently delete your account and all data.</p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-3 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </section>

      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
    </div>
  );
}
