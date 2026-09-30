'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { ArrowLeft, Loader2, Plus, Trash2, Save, CheckCircle2, Coins } from 'lucide-react';
import type { CommissionRate, CommissionSettings } from '@/components/partners/earnings';

const BLANK: CommissionSettings = { enabled: false, headline: '', description: '', rates: [], footnote: '' };

export default function PartnersAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [s, setS] = useState<CommissionSettings>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Staff gate
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else { setAllowed(false); router.replace('/dashboard'); }
    });
  }, [user, isUserLoading, firestore, router]);

  useEffect(() => {
    if (!allowed) return;
    getDoc(doc(firestore, 'partner_settings', 'commission'))
      .then((snap) => { if (snap.exists()) setS({ ...BLANK, ...(snap.data() as CommissionSettings) }); })
      .finally(() => setLoading(false));
  }, [allowed, firestore]);

  const rates = s.rates ?? [];
  const setRate = (i: number, k: keyof CommissionRate, v: string) =>
    setS((p) => ({ ...p, rates: (p.rates ?? []).map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRate = () => setS((p) => ({ ...p, rates: [...(p.rates ?? []), { label: '', value: '', note: '' }] }));
  const delRate = (i: number) => setS((p) => ({ ...p, rates: (p.rates ?? []).filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const clean = {
        enabled: !!s.enabled,
        headline: (s.headline ?? '').trim(),
        description: (s.description ?? '').trim(),
        footnote: (s.footnote ?? '').trim(),
        rates: (s.rates ?? []).filter((r) => r.label.trim() && r.value.trim()).map((r) => ({ label: r.label.trim(), value: r.value.trim(), note: (r.note ?? '').trim() })),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, 'partner_settings', 'commission'), clean, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Could not save: ' + (e instanceof Error ? e.message : 'unknown error'));
    } finally { setSaving(false); }
  };

  if (isUserLoading || allowed === null || (allowed && loading)) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (!allowed) return null;

  const inp = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Admin dashboard</Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-black"><Coins size={22} className="text-emerald-600" /> Partner Commission</h1>
      <p className="mt-1 text-sm text-slate-600">Set what partners can earn from referrals. This shows on the public <Link href="/partners" className="font-bold text-blue-600 hover:underline">partner page</Link> only when enabled.</p>

      <div className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={!!s.enabled} onChange={(e) => setS((p) => ({ ...p, enabled: e.target.checked }))} className="h-5 w-5" />
          <span className="text-sm font-black">Show the “Earn from referrals” section on the partner page</span>
        </label>

        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Headline</span>
          <input value={s.headline ?? ''} onChange={(e) => setS((p) => ({ ...p, headline: e.target.value }))} className={inp} placeholder="e.g. Earn when your referrals enrol" /></label>

        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Description</span>
          <textarea value={s.description ?? ''} onChange={(e) => setS((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp} placeholder="Short intro about the reward programme" /></label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Commission rates</span>
            <button onClick={addRate} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800"><Plus size={13} /> Add rate</button>
          </div>
          <div className="space-y-2">
            {rates.length === 0 && <p className="text-xs text-slate-400">No rates yet — add one (e.g. Individual · 10% · per enrolment).</p>}
            {rates.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2">
                <input value={r.value} onChange={(e) => setRate(i, 'value', e.target.value)} placeholder="10%" className={`${inp} w-20`} />
                <input value={r.label} onChange={(e) => setRate(i, 'label', e.target.value)} placeholder="Label (e.g. Individual)" className={`${inp} flex-1 min-w-[120px]`} />
                <input value={r.note ?? ''} onChange={(e) => setRate(i, 'note', e.target.value)} placeholder="Note (e.g. per enrolment)" className={`${inp} flex-1 min-w-[120px]`} />
                <button onClick={() => delRate(i)} className="h-9 w-9 shrink-0 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 inline-flex items-center justify-center"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Footnote / terms</span>
          <input value={s.footnote ?? ''} onChange={(e) => setS((p) => ({ ...p, footnote: e.target.value }))} className={inp} placeholder="e.g. Commissions are paid after enrolment. Terms apply." /></label>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
          {saved && <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600"><CheckCircle2 size={16} /> Saved</span>}
        </div>
      </div>
    </div>
  );
}
