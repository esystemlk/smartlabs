'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { payhereUrls } from '@/lib/payhere';
import { IELTS_MOCKS } from '@/lib/ielts-mock/mocks';
import { IELTS_MOCK_PACKAGES } from '@/lib/ielts-mock-packages';
import {
  ArrowLeft, ArrowRight, Headphones, BookOpen, PenLine, Loader2, CreditCard,
  X, Check, Clock, Ticket,
} from 'lucide-react';

const CRIMSON = '#dc2626';

export default function IeltsMockCatalog() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isUserLoading } = useUser();

  const [credits, setCredits] = useState<{ unlimited: boolean; remaining: number } | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const load = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ielts-mock-credits/balance', { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.ok) setCredits(await res.json());
    } catch { /* ignore */ }
  };
  useEffect(() => { if (user) void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);
  useEffect(() => { if (params.get('payment') === 'success') { void load(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params]);
  useEffect(() => { if (payhereParams && formRef.current) formRef.current.submit(); }, [payhereParams]);

  const buy = async (packageId: string) => {
    if (!user) { router.push('/login?redirect=/dashboard/ielts/mock-tests'); return; }
    setBuying(packageId); setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ielts-mock-credits/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ packageId }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) throw new Error(d.error || 'Could not start checkout.');
      setPayhereParams(d.params);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start checkout.'); setBuying(null); }
  };

  const remaining = credits?.unlimited ? -1 : credits?.remaining ?? 0;

  const icons = [<Headphones key="l" size={13} />, <BookOpen key="r" size={13} />, <PenLine key="w" size={13} />];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white">
      <form ref={formRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link href="/dashboard/ielts" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={15} /> IELTS Studio
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CRIMSON }}><Ticket size={22} /></div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: CRIMSON }}>IELTS Academic</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Mock Tests</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-5">Full timed mocks — Listening, Reading and Writing, scored on the IELTS band scale. Overall = (L + R + W) ÷ 3. Speaking is assessed in person at Smart Labs.</p>

        <div className="mb-7 flex items-center gap-2 flex-wrap">
          {user && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-700">
              <Ticket size={13} /> {remaining === -1 ? 'Unlimited' : `${remaining} mock credit${remaining === 1 ? '' : 's'}`}
            </span>
          )}
          <button onClick={() => setShowBuy(true)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: CRIMSON }}>
            <CreditCard size={13} /> Buy mock credits
          </button>
        </div>

        {isUserLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-3">
            {IELTS_MOCKS.map((m, i) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: CRIMSON, backgroundColor: '#fee2e2' }}>Mock {i + 1}</span>
                  <h3 className="text-base font-black text-slate-900">{m.title}</h3>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  {[[0, `Listening · ${m.listening.label}`], [1, `Reading · ${m.reading.label}`], [2, `Writing · ${m.writingLabel.replace('Cambridge 21 · ', '')}`]].map(([ic, t]) => (
                    <span key={t as string} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">{icons[ic as number]} {t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Clock size={12} /> ~2 hours · 40 + 40 + 2 tasks</span>
                  <Link href={`/dashboard/ielts/mock-tests/${m.id}`} className="inline-flex items-center gap-1.5 text-sm font-black text-white px-4 py-2 rounded-xl" style={{ backgroundColor: CRIMSON }}>
                    Open <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !buying && setShowBuy(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-black text-slate-900">IELTS Mock Credits</h2>
              <button onClick={() => !buying && setShowBuy(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Each credit is one full mock (Listening + Reading + Writing, AI-scored).</p>
            {error && <p className="text-sm font-bold text-red-600 mb-3">{error}</p>}
            <div className="space-y-3">
              {IELTS_MOCK_PACKAGES.map(p => (
                <div key={p.id} className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${p.popular ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900">{p.label}</p>
                      {p.popular && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CRIMSON }}>Best value</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.credits} mock{p.credits === 1 ? '' : 's'}</p>
                  </div>
                  <button onClick={() => buy(p.id)} disabled={!!buying} className="px-4 py-2.5 rounded-xl text-white font-black text-sm whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: CRIMSON }}>
                    {buying === p.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} LKR {p.price.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">Secure payment via PayHere.</p>
          </div>
        </div>
      )}
    </div>
  );
}
