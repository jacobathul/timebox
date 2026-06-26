import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FolderTree, RefreshCw } from 'lucide-react';
import { AccountSettings } from '../components/settings/AccountSettings';
import { ContextSettings } from '../components/contexts/ContextSettings';
import { RecurringTasksSettingsPage } from './RecurringTasksSettingsPage';

type Tab = 'account' | 'contexts' | 'recurring';

interface Props {
  initialTab?: Tab;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'account',  label: 'Account',  icon: <User size={15} /> },
  { id: 'contexts', label: 'Contexts', icon: <FolderTree size={15} /> },
  { id: 'recurring', label: 'Recurring', icon: <RefreshCw size={15} /> },
];

export function AccountSettingsPage({ initialTab = 'account' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-50">
      {/* Header — desktop keeps the original link, mobile uses button for back */}
      <div className="border-b border-stone-200 bg-white px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors min-h-[44px] md:min-h-0"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <span className="text-stone-200">/</span>
        <span className="text-sm text-stone-600 font-medium">Settings</span>
      </div>

      {/* Mobile: horizontal tab bar */}
      <div className="flex md:hidden border-b border-stone-200 bg-white flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop: side nav + content; Mobile: full-width content */}
      <div className="flex flex-1 overflow-hidden w-full md:max-w-3xl md:mx-auto px-4 pt-4 md:pt-6 gap-6">
        {/* Desktop sidebar nav */}
        <nav className="hidden md:flex flex-col flex-shrink-0 w-44">
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
        <div className="flex-1 overflow-y-auto pb-8 min-w-0">
          {tab === 'account'  && <AccountSettings />}
          {tab === 'contexts' && <ContextSettings />}
          {tab === 'recurring' && <RecurringTasksSettingsPage />}
        </div>
      </div>
    </div>
  );
}
