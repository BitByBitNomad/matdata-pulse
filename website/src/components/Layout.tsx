import React from 'react';
import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { SafeUser } from '../types/survey';

interface LayoutProps {
  user: SafeUser;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, refreshing, onRefresh, onLogout, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                Matdata Pulse
              </h1>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Field Voter Outreach & Real-Time Analytics Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden md:flex flex-col items-end pr-2 border-r border-slate-700">
              <span className="text-xs font-semibold text-white">{user.fullName}</span>
              <span className="text-[11px] text-amber-300 uppercase tracking-wide">
                {user.role}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-xs font-semibold text-white transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
