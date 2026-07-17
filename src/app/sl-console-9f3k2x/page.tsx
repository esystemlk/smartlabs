'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  ShieldAlert, Loader2, Check, Globe, Wrench, RefreshCw, Ban, Eye, LogIn,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { SITE_MODES, type SiteMode } from '@/lib/site-mode';

const ICONS: Record<SiteMode, React.ElementType> = {
  live: Globe,
  '404': Ban,
  maintenance: Wrench,
  updating: RefreshCw,
};

// Full class strings — Tailwind can't see runtime-built names like `bg-${x}-500`.
const TONE: Record<SiteMode, { card: string; icon: string }> = {
  live: { card: 'bg-emerald-500/10 border-emerald-500/40', icon: 'bg-emerald-500/20' },
  '404': { card: 'bg-red-500/10 border-red-500/40', icon: 'bg-red-500/20' },
  maintenance: { card: 'bg-amber-500/10 border-amber-500/40', icon: 'bg-amber-500/20' },
  updating: { card: 'bg-blue-500/10 border-blue-500/40', icon: 'bg-blue-500/20' },
};

export default function DevConsolePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<SiteMode>('live');
  const [message, setMessage] = useState('');
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [busy, setBusy] = useState<SiteMode | null>(null);
  const [preview, setPreview] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Role check
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { setChecking(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', user.uid));
        setRole((snap.data()?.role as string) ?? 'student');
      } catch {
        setRole('student');
      } finally {
        setChecking(false);
      }
    })();
  }, [user, isUserLoading, firestore]);

  // Load current mode once we know they're a developer
  useEffect(() => {
    if (role !== 'developer' || !user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/site-mode', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          setMode(d.mode); setMessage(d.message ?? ''); setUpdatedBy(d.updatedBy ?? null);
        }
      } catch { /* ignore */ }
    })();
  }, [role, user]);

  const apply = async (next: SiteMode) => {
    if (!user) return;
    setBusy(next); setError(null); setToast(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/site-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: next, message, preview }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update.');
      setMode(next);
      setToast(next === 'live' ? 'Site is live again.' : `Site is now in "${next}" mode for everyone.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update.');
    } finally {
      setBusy(null);
    }
  };

  // ── Gates ──
  if (isUserLoading || checking) {
    return <Shell><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <ShieldAlert className="h-10 w-10 text-slate-300 mb-4" />
        <h1 className="text-xl font-black text-white">Sign in required</h1>
        <p className="text-slate-400 text-sm mt-1 mb-6">This console is restricted.</p>
        <Link href="/login?redirect=/sl-console-9f3k2x" className="inline-flex items-center gap-2 bg-white text-slate-900 font-black text-sm px-5 py-3 rounded-xl">
          <LogIn size={15} /> Sign In
        </Link>
      </Shell>
    );
  }

  // Anything other than developer gets the same dead-end — no hints.
  if (role !== 'developer') {
    return (
      <Shell>
        <ShieldAlert className="h-10 w-10 text-red-500/70 mb-4" />
        <h1 className="text-xl font-black text-white">Not authorised</h1>
        <p className="text-slate-400 text-sm mt-1">This console requires the developer role.</p>
        <p className="text-slate-600 text-xs mt-6">Signed in as {user.email}</p>
      </Shell>
    );
  }

  const current = SITE_MODES.find(m => m.id === mode);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-5 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">Developer Console</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Site Mode</h1>
        <p className="text-slate-400 text-sm mt-1">
          Applies to every page and link instantly — including direct links like /dashboard.
        </p>

        {/* Current status */}
        <div className={`mt-6 rounded-2xl border p-4 flex items-center gap-3 ${
          mode === 'live' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
        }`}>
          <span className={`h-2.5 w-2.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
          <div className="flex-1">
            <p className="font-black text-sm">
              {mode === 'live' ? 'Site is LIVE' : `Site is DOWN — "${current?.label}"`}
            </p>
            <p className="text-[11px] text-slate-400">
              {mode === 'live' ? 'Students can use the site normally.' : 'Everyone except you sees the status page.'}
              {updatedBy && ` · last set by ${updatedBy}`}
            </p>
          </div>
        </div>

        {/* Message */}
        <label className="block mt-6 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
          Optional note (shown to you in this console only)
        </label>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="e.g. deploying v2.1"
          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-slate-600"
        />

        {/* Preview toggle */}
        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input type="checkbox" checked={preview} onChange={e => setPreview(e.target.checked)} className="accent-emerald-500" />
          <Eye size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300 font-semibold">
            Keep my access — let me still browse the real site while it&apos;s off
          </span>
        </label>

        {/* Modes */}
        <div className="grid gap-3 mt-6">
          {SITE_MODES.map(m => {
            const Icon = ICONS[m.id];
            const active = mode === m.id;
            const tone = TONE[m.id];
            return (
              <button
                key={m.id}
                onClick={() => apply(m.id)}
                disabled={!!busy}
                className={`text-left rounded-2xl border p-4 flex items-center gap-4 transition-all disabled:opacity-60 ${
                  active ? tone.card : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? tone.icon : 'bg-slate-800'}`}>
                  {busy === m.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{m.label}</p>
                  <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
                </div>
                {active && <Check className="h-5 w-5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {toast && <p className="mt-5 text-sm text-emerald-400 font-semibold">{toast}</p>}
        {error && <p className="mt-5 text-sm text-red-400 font-semibold">{error}</p>}

        <p className="mt-10 text-[11px] text-slate-600 leading-relaxed">
          Changes take effect within ~10 seconds (edge cache). Payment webhooks keep running in every
          mode so no purchase is lost. Signed in as {user.email}.
        </p>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  );
}
