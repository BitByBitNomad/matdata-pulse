import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Handled via AuthContext error state
    }
  };

  const fillDemoAdmin = () => {
    clearError();
    setEmail('director@matdatapulse.in');
    setPassword('Director@2026!');
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-fade-up">
        <div className="lg:col-span-5 bg-[#0B132B] text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-8">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight block leading-none">
                  Matdata Pulse
                </span>
                <span className="text-[11px] text-slate-400">Campaign Operations</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight leading-snug text-white">
              Booth-level citizen intelligence, verified in real time.
            </h1>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Review offline-synced field surveys, monitor ward sentiment shifts, and audit field submissions from one console.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Role-scoped JWT & Redis session security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Row-locked audit transitions in PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Idempotent offline mobile batch sync</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Director Portal
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Sign in to your workspace</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your campaign director credentials to continue.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@matdatapulse.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0B132B] hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">Evaluating locally?</span>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 cursor-pointer transition"
            >
              Use demo director account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
