'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { ArrowLeft, Loader2, Megaphone, Send, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

const DEFAULT_SUBJECT = 'New on Smart Labs: fresh IELTS & PTE practice is waiting 🎯';

export default function CampaignPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [testing, setTesting] = useState(false);
  const [running, setRunning] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({ sent: 0, skipped: 0, failed: 0, processed: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role;
      if (['admin', 'developer'].includes(role)) setAllowed(true);
      else { setAllowed(false); router.replace('/dashboard'); }
    });
  }, [user, isUserLoading, firestore, router]);

  const sendTest = async () => {
    setTestMsg(''); setError(''); setTesting(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/admin/campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ test: true, subject }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not send test.'); return; }
      setTestMsg(`Test sent to ${data.sentTo}. Check your inbox.`);
    } catch { setError('Network error.'); }
    finally { setTesting(false); }
  };

  const sendAll = async () => {
    if (!window.confirm('Send the campaign email to ALL registered users (except those who opted out)? This cannot be undone.')) return;
    setError(''); setFinished(false); setRunning(true);
    const acc = { sent: 0, skipped: 0, failed: 0, processed: 0 };
    setTotals(acc);
    let cursor: string | null | undefined = undefined;
    try {
      // Page through the user base; each request sends a small batch.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const token = await user!.getIdToken();
        const res: Response = await fetch('/api/admin/campaign', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ startAfter: cursor ?? undefined, subject, limit: 15 }),
        });
        const data: { sent?: number; skipped?: number; failed?: number; processed?: number; done?: boolean; nextCursor?: string | null; error?: string } = await res.json();
        if (!res.ok) { setError(data.error || 'Campaign stopped with an error.'); break; }
        acc.sent += data.sent ?? 0; acc.skipped += data.skipped ?? 0; acc.failed += data.failed ?? 0; acc.processed += data.processed ?? 0;
        setTotals({ ...acc });
        cursor = data.nextCursor;
        if (data.done) { setFinished(true); break; }
      }
    } catch { setError('Network error — the campaign was paused. You can run it again; already-sent users just receive it once more only if re-run from the start.'); }
    finally { setRunning(false); }
  };

  if (isUserLoading || allowed === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (!allowed) return null;

  const inp = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Admin dashboard</Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-black"><Megaphone size={22} className="text-blue-600" /> User Email Campaign</h1>
      <p className="mt-2 text-sm text-slate-600">Send the re-engagement email to registered users. Opted-out users are skipped automatically, and every email includes an unsubscribe link.</p>

      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>Emails currently send through Gmail, which allows about <b>500 per day</b>. For a large user base, run the campaign over multiple days or switch to a dedicated email service (Resend / Brevo). Always send a test to yourself first.</span>
      </div>

      <div className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Subject line</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inp} />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={sendTest} disabled={testing || running} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Send test to myself
          </button>
          <button onClick={sendAll} disabled={running || testing} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
            {running ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {running ? 'Sending…' : 'Send to all users'}
          </button>
          {testMsg && <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600"><CheckCircle2 size={15} /> {testMsg}</span>}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        {(running || totals.processed > 0) && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span><b className="text-lg text-emerald-600">{totals.sent}</b> <span className="text-slate-500">sent</span></span>
              <span><b className="text-lg text-slate-600">{totals.skipped}</b> <span className="text-slate-500">skipped (opt-out / no email)</span></span>
              <span><b className="text-lg text-red-600">{totals.failed}</b> <span className="text-slate-500">failed</span></span>
              <span><b className="text-lg text-slate-900">{totals.processed}</b> <span className="text-slate-500">processed</span></span>
            </div>
            {running && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Sending in batches — keep this tab open until it finishes.</p>}
            {finished && <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600"><CheckCircle2 size={15} /> Campaign finished.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
