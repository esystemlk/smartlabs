'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Coins, TrendingUp } from 'lucide-react';

export interface CommissionRate { label: string; value: string; note?: string }
export interface CommissionSettings {
  enabled?: boolean;
  headline?: string;
  description?: string;
  rates?: CommissionRate[];
  footnote?: string;
}

/** Public "Earn from referrals" section — driven by the admin-set commission doc. */
export function PartnerEarnings() {
  const firestore = useFirestore();
  const [s, setS] = useState<CommissionSettings | null>(null);

  useEffect(() => {
    let alive = true;
    getDoc(doc(firestore, 'partner_settings', 'commission'))
      .then((snap) => { if (alive) setS(snap.exists() ? (snap.data() as CommissionSettings) : null); })
      .catch(() => { /* section stays hidden */ });
    return () => { alive = false; };
  }, [firestore]);

  const rates = s?.rates?.filter((r) => r.label && r.value) ?? [];
  if (!s?.enabled || rates.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-blue-50/60 to-white">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-600">
            <Coins size={14} /> Earn from referrals
          </div>
          <h2 className="text-2xl font-black sm:text-3xl">{s.headline || 'Earn when your referrals enrol'}</h2>
          {s.description ? <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{s.description}</p> : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rates.map((r, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp size={20} /></div>
              <div className="text-3xl font-black text-slate-900">{r.value}</div>
              <div className="mt-1 text-sm font-black text-slate-700">{r.label}</div>
              {r.note ? <p className="mt-1 text-xs text-slate-500">{r.note}</p> : null}
            </div>
          ))}
        </div>

        {s.footnote ? <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">{s.footnote}</p> : null}
      </div>
    </section>
  );
}
