import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, PlusCircle, Loader2, RefreshCw, Mail } from 'lucide-react';
import { useGoogleIntegrationStore } from '../../store/useGoogleIntegrationStore';
import { GmailEmailToTaskModal } from './GmailEmailToTaskModal';
import type { ParsedEmail } from '../../integrations/google/types';

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function GmailBrowser() {
  const { emails, loadingEmails, emailQuery, fetchEmails, connectedAccount } = useGoogleIntegrationStore();
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(null);
  const [localQuery, setLocalQuery] = useState(emailQuery);

  useEffect(() => {
    if (connectedAccount?.isActive && emails.length === 0) {
      void fetchEmails();
    }
  }, [connectedAccount, emails.length, fetchEmails]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void fetchEmails(localQuery);
  }

  if (!connectedAccount?.isActive) return null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Mail size={14} />Recent Emails
          </h3>
          <button
            type="button"
            onClick={() => void fetchEmails(emailQuery)}
            disabled={loadingEmails}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loadingEmails ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search emails… (e.g. from:boss@co.com)"
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loadingEmails}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
          >
            <Search size={14} />
          </button>
        </form>

        {/* Email list */}
        {loadingEmails ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-stone-300" />
          </div>
        ) : emails.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">No emails found</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {emails.map((email) => (
              <div
                key={email.id}
                className="group flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-white hover:border-accent-300 hover:bg-accent-50/30 transition-all cursor-pointer"
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800 truncate">{email.subject}</p>
                    <span className="text-xs text-stone-400 flex-shrink-0">{formatRelativeDate(email.date)}</span>
                  </div>
                  <p className="text-xs text-stone-500 truncate mt-0.5">{email.from}</p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">{email.snippet}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedEmail(email); }}
                    className="flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium"
                    title="Create task from email"
                  >
                    <PlusCircle size={13} />
                  </button>
                  <a
                    href={email.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-stone-400 hover:text-stone-600"
                    title="Open in Gmail"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmail && (
        <GmailEmailToTaskModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </>
  );
}
