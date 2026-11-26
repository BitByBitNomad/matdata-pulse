import React from 'react';
import { LogOut, RefreshCw, Shield } from 'lucide-react';
import { SafeUser } from '../types/survey';

interface LayoutProps {
  user: SafeUser;
  refreshing: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({
  user,
  refreshing,
  lastUpdated,
  onRefresh,
  onLogout,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0B132B] flex items-center justify-center shadow-xs">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  Matdata Pulse
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                Field Voter Outreach & Constituency Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {lastUpdated && (
              <span className="hidden lg:inline text-[11px] text-slate-400 font-mono-num">
                Synced {lastUpdated}
              </span>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-semibold text-slate-900 block">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7 space-y-6">
        {children}
      </main>
    </div>
  );
}
