import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AccountSettings } from '../components/settings/AccountSettings';

export function AccountSettingsPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="border-b border-stone-200 bg-white px-6 py-3 flex items-center gap-3">
        <Link
          to="/app"
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to planner
        </Link>
        <span className="text-stone-200">/</span>
        <span className="text-sm text-stone-600 font-medium">Account Settings</span>
      </div>
      <AccountSettings />
    </div>
  );
}
