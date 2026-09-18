'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { payhereUrls } from '@/lib/payhere';
import {
  Coins, Check, Crown, Loader2, ShieldCheck, ChevronLeft, Sparkles, AlertCircle,
} from 'lucide-react';

interface Pkg { id: string; label: string; price: number; priceUSD: number; scoring: number; best?: boolean }
const UNIVERSAL_PACKAGES: Pkg[] = [
  { id: 'universal_10', label: '10 AI Credits', price: 1500, priceUSD: 5, scoring: 10 },
  { id: 'universal_40', label: '40 AI Credits', price: 3500, priceUSD: 12, scoring: 40, best: true },
  { id: 'universal_100', label: '100 AI Credits', price: 6000, priceUSD: 20, scoring: 100 },
  { id: 'universal_unlimited', label: 'Unlimited · 40 days', price: 15000, priceUSD: 50, scoring: -1 },
];
type Currency = 'LKR' | 'USD';
const fmtPrice = (pkg: Pkg, c: Currency) => c === 'USD' ? `$${pkg.priceUSD}` : `Rs ${pkg.price.toLocaleString()}`;
const AI_PARTS = ['Write Essay', 'Summarize Written Text', 'Summarize Spoken Text', 'All Speaking tasks', 'IELTS Essay'];

function CreditsInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useSearchParams();
  const paymentState = params.get('payment'); // 'success' | 'cancelled' | null

  const [balance, setBalance] = useState<{ paid: number; planActive: boolean; planExpiry: string | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [currency, setCurrency] = useState<Currency>('LKR');

  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (payhereParams && formRef.current) formRef.current.submit(); }, [payhereParams]);

  const loadBalance = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      const snap = await getDoc(doc(firestore, 'users', user.uid));
      const d = snap.data() ?? {};
      // universalMonthlyExpiry is stored as a Firestore Timestamp for web grants.
      const exp = (d.universalMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
      setBalance({
        paid: (d.universalPaidCredits as number) ?? 0,
        planActive: !!(exp && exp > new Date()),
        planExpiry: exp ? exp.toISOString() : null,
      });
    } catch { /* non-fatal */ }
  }, [user, firestore]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  const buy = async (pkg: Pkg) => {
    if (!user) { router.push('/login?redirect=/credits'); return; }
    setBusy(pkg.id);
    setErr('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/universal-credits/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkg.id, currency }), // web → default (website) PayHere secret
      });
      const data = await res.json();
      if (!res.ok || !data.params) { setErr(data.error || 'Could not start checkout. Please try again.'); return; }
      setPayhereParams(data.params);
    } catch {
      setErr('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hidden PayHere form (auto-submits) */}
      <form ref={formRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ChevronLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Coins size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">AI Credits</h1>
            <p className="text-sm text-slate-500">One credit = one AI scoring · works on every AI part</p>
          </div>
        </div>

        {/* Currency toggle */}
        <div className="mt-5 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pay in</span>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['LKR', 'USD'] as Currency[]).map((c) => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`rounded-lg px-4 py-1.5 text-sm font-black transition-colors ${currency === c ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Payment result banner */}
        {paymentState === 'success' && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <Check size={20} /> <span className="text-sm font-semibold">Payment received — your credits will appear here once PayHere confirms it (usually seconds).</span>
          </div>
        )}
        {paymentState === 'cancelled' && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
            <AlertCircle size={20} /> <span className="text-sm font-semibold">Payment cancelled. You can try again any time.</span>
          </div>
        )}

        {/* Current balance */}
        {!isUserLoading && user && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-orange-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">Your balance</p>
                <p className="text-xs text-slate-500">shared with the SmartLabs mobile app</p>
              </div>
            </div>
            <div className="text-right">
              {balance?.planActive ? (
                <span className="inline-flex items-center gap-1 text-sm font-black text-amber-600"><Crown size={14} /> Unlimited plan</span>
              ) : (
                <p className="text-xl font-black tabular-nums text-slate-900">{balance ? balance.paid : '—'} <span className="text-sm font-semibold text-slate-500">credits</span></p>
              )}
            </div>
          </div>
        )}

        {/* Works-on list */}
        <div className="mt-6 rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Works on every AI-scored part</p>
          <div className="grid grid-cols-2 gap-2">
            {AI_PARTS.map((p) => (
              <div key={p} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Check size={15} className="text-emerald-500" /> {p}
              </div>
            ))}
          </div>
        </div>

        {err && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600"><AlertCircle size={15} /> {err}</p>}

        {/* Packages */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {UNIVERSAL_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => buy(pkg)}
              disabled={!!busy}
              className={`relative flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md disabled:opacity-60 ${
                pkg.best ? 'border-orange-400 bg-orange-50/40' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {pkg.best && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Popular</span>
              )}
              <div>
                <p className="text-base font-black text-slate-900">{pkg.label}</p>
                <p className="text-sm text-slate-500">{pkg.scoring === -1 ? 'Unlimited AI scorings for 40 days' : `${pkg.scoring} AI scorings`}</p>
              </div>
              {busy === pkg.id
                ? <Loader2 size={20} className="animate-spin text-orange-500" />
                : <span className="text-lg font-black text-orange-600">{fmtPrice(pkg, currency)}</span>}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Any part-specific credits you already own are used first, then your universal credits.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" /> Secure checkout via PayHere.
        </div>

        {!isUserLoading && !user && (
          <p className="mt-6 text-center text-sm text-slate-600">
            Please <Link href="/login?redirect=/credits" className="font-bold text-orange-600 hover:underline">sign in</Link> to buy credits.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
      <CreditsInner />
    </Suspense>
  );
}
