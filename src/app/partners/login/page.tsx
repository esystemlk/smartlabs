'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Handshake, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PartnerLoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const resolveEmail = async (id: string): Promise<string | null> => {
    if (EMAIL_RE.test(id)) return id;
    try {
      const res = await fetch('/api/partners/resolve-username', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: id }),
      });
      if (!res.ok) return null;
      return (await res.json()).email ?? null;
    } catch { return null; }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try {
      const email = await resolveEmail(identifier.trim());
      if (!email) { setError('Invalid username/email or password.'); return; }
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/partners/workspace');
    } catch {
      setError('Invalid username/email or password.');
    } finally { setBusy(false); }
  };

  const forgot = async () => {
    setError(''); setInfo('');
    const email = await resolveEmail(identifier.trim());
    if (!email) { setError('Enter your username or email first.'); return; }
    try { await sendPasswordResetEmail(auth, email); setInfo('If an account exists, a password reset email has been sent.'); }
    catch { setInfo('If an account exists, a password reset email has been sent.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Partner programme</Link>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-blue-600"><Handshake size={14} /> Partner login</div>
          <h1 className="text-2xl font-black">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in with your username or email.</p>

          {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</div>}
          {info && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {info}</div>}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Username or email</span>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoCapitalize="none" autoCorrect="off"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <button type="submit" disabled={busy || !identifier || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null} Sign in
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <button onClick={forgot} className="font-bold text-slate-500 hover:text-slate-900">Forgot password?</button>
            <Link href="/partners/register" className="font-bold text-blue-600 hover:underline">Become a partner</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
