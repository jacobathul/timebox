import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, FolderTree } from 'lucide-react';
import { AccountSettings } from '../components/settings/AccountSettings';
import { ContextSettings } from '../components/contexts/ContextSettings';

type Tab = 'account' | 'contexts';

interface Props {
  initialTab?: Tab;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'account',  label: 'Account',  icon: <User size={15} /> },
  { id: 'contexts', label: 'Contexts', icon: <FolderTree size={15} /> },
];

export function AccountSettingsPage({ initialTab = 'account' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          to="/app/today"
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>
        <span className="text-stone-200">/</span>
        <span className="text-sm text-stone-600 font-medium">Settings</span>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-3xl mx-auto w-full px-4 pt-6 gap-6">
        {/* Tab nav */}
        <nav className="flex-shrink-0 w-44">
          <ul className="space-y-0.5">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-accent-50 text-accent-600' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {tab === 'account'  && <AccountSettings />}
          {tab === 'contexts' && <ContextSettings />}
        </div>
      </div>
    </div>
  );
}
