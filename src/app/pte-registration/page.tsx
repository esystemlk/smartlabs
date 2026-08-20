'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import { PTE_PACKAGES, formatLkr, type PtePackage } from '@/lib/pte-packages';
import {
  Check, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Clock, MapPin,
  Users, CalendarDays, ShieldCheck, Sparkles, Phone, GraduationCap, Star,
} from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  mode: 'online' | 'hybrid';
  location?: string;
  startDate?: string;
  schedule?: string;
  seats?: number;
  seatsFilled?: number;
  packageIds?: string[];
  status: 'open' | 'closed';
  note?: string;
}

function seatsLeft(b: Batch): number | null {
  if (!b.seats || b.seats <= 0) return null; // unlimited
  return Math.max(0, b.seats - (b.seatsFilled ?? 0));
}

/** A distinct theme-palette colour per package: blue · green · purple. */
const PKG_THEME: Record<string, {
  borderSoft: string; borderStrong: string; ring: string; softBg: string;
  check: string; price: string; btnIdle: string; btnActive: string; header: string; band: string;
}> = {
  boostify: {
    borderSoft: 'border-primary/30 hover:border-primary/60', borderStrong: 'border-primary',
    ring: 'ring-primary/30', softBg: 'bg-primary/5', check: 'text-primary', price: 'text-primary',
    btnIdle: 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
    btnActive: 'bg-primary text-primary-foreground', header: 'text-primary',
    band: 'from-blue-600 to-cyan-500',
  },
  boostify_plus: {
    borderSoft: 'border-accent-2/40 hover:border-accent-2/70', borderStrong: 'border-accent-2',
    ring: 'ring-accent-2/30', softBg: 'bg-accent-2/5', check: 'text-accent-2', price: 'text-accent-2',
    btnIdle: 'bg-accent-2/10 text-accent-2 hover:bg-accent-2 hover:text-white',
    btnActive: 'bg-accent-2 text-white', header: 'text-accent-2',
    band: 'from-emerald-600 to-green-500',
  },
  hybrid_boostify_pro: {
    borderSoft: 'border-accent-3/50 hover:border-accent-3/80', borderStrong: 'border-accent-3',
    ring: 'ring-accent-3/30', softBg: 'bg-accent-3/5', check: 'text-accent-3', price: 'text-accent-3',
    btnIdle: 'bg-accent-3/10 text-accent-3 hover:bg-accent-3 hover:text-white',
    btnActive: 'bg-accent-3 text-white', header: 'text-accent-3',
    band: 'from-violet-600 to-purple-600',
  },
};
const pkgTheme = (id: string) => PKG_THEME[id] ?? PKG_THEME.boostify;

/** Coloured hour/feature breakdown shown as an "equation" on each card. */
const PKG_EXTRAS: Record<string, { feeTag: string; breakdown: { value: string; unit: string; label: string }[] }> = {
  boostify: {
    feeTag: 'Great Value',
    breakdown: [
      { value: '20', unit: 'Hours', label: 'PTE Intensive' },
      { value: '8', unit: 'Hours', label: 'PTE Grammar' },
    ],
  },
  boostify_plus: {
    feeTag: 'Great Value',
    breakdown: [
      { value: '20', unit: 'Hours', label: 'PTE Intensive' },
      { value: '8', unit: 'Hours', label: 'PTE Grammar' },
      { value: '2', unit: 'Sessions', label: 'Group Feedback' },
    ],
  },
  hybrid_boostify_pro: {
    feeTag: 'Best Value',
    breakdown: [
      { value: '20', unit: 'Hours', label: 'PTE Intensive' },
      { value: '8', unit: 'Hours', label: 'PTE Grammar' },
      { value: '2', unit: 'Sessions', label: 'Group Feedback' },
      { value: '30', unit: 'Days', label: 'WhatsApp Fix' },
    ],
  },
};
const pkgExtras = (id: string) => PKG_EXTRAS[id] ?? PKG_EXTRAS.boostify;
/** Cycled colours for the equation boxes. */
const BOX_COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 'bg-violet-600'];

function RegistrationInner() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [selectedPkg, setSelectedPkg] = useState<PtePackage['id'] | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  // ── Open batches ──────────────────────────────────────────────────────────
  const batchesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'pte_batches'), where('status', '==', 'open')) : null),
    [firestore]
  );
  const { data: batchesRaw, isLoading: batchesLoading } = useCollection(batchesQuery);
  const batches = useMemo<Batch[]>(() => (batchesRaw as Batch[] | undefined) ?? [], [batchesRaw]);

  // Batches that offer the selected package (empty packageIds = offers all).
  const availableBatches = useMemo(() => {
    if (!selectedPkg) return batches;
    return batches.filter(b => !b.packageIds?.length || b.packageIds.includes(selectedPkg));
  }, [batches, selectedPkg]);

  // Reset a batch that stops being valid for the chosen package.
  useEffect(() => {
    if (selectedBatch && !availableBatches.some(b => b.id === selectedBatch)) setSelectedBatch('');
  }, [availableBatches, selectedBatch]);

  // Prefill name once we know the user.
  useEffect(() => { if (user?.displayName && !fullName) setFullName(user.displayName); }, [user]); // eslint-disable-line

  // Payment return.
  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') toast({ title: 'Payment successful! 🎉', description: 'Check your email for the receipt and access details.' });
    else if (p === 'cancelled') toast({ title: 'Payment cancelled', variant: 'destructive' });
  }, [searchParams]); // eslint-disable-line

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const chosenPkg = selectedPkg ? PTE_PACKAGES.find(p => p.id === selectedPkg)! : null;

  const handleRegister = async () => {
    if (!user) { router.push('/login?redirect=/pte-registration'); return; }
    if (!selectedPkg) { toast({ variant: 'destructive', title: 'Please choose a course package.' }); return; }
    if (!selectedBatch) { toast({ variant: 'destructive', title: 'Please select a batch.' }); return; }
    if (fullName.trim().length < 2) { toast({ variant: 'destructive', title: 'Please enter your full name.' }); return; }
    if (phone.replace(/[^0-9+]/g, '').length < 9) { toast({ variant: 'destructive', title: 'Enter a valid contact number.' }); return; }
    if (!agreed) { toast({ variant: 'destructive', title: 'Please accept the non-refundable payment notice.' }); return; }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/pte-registration/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selectedPkg, batchId: selectedBatch, fullName: fullName.trim(), phone }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) { toast({ variant: 'destructive', title: d.error || 'Could not start payment.' }); return; }
      setPayhereParams(d.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden PayHere form */}
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-1/10 blur-[120px]" />
        <div className="container relative mx-auto px-4 py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> PTE Academic Preparation Programmes
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-headline font-bold">
            More Than a Course. <span className="gradient-text">A Mentorship.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">
            Empowering students with strategy, language development, and continuous mentorship to achieve
            their target PTE score — from your first class until exam day.
          </p>
          <p className="mt-5 text-xs font-semibold tracking-[0.3em] text-primary">LEARN · PRACTISE · SUCCEED</p>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────────────────── */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-headline font-bold">Choose Your Pathway</h2>
            <p className="mt-2 text-muted-foreground">Three learning pathways. One goal — your target PTE score.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto items-start">
            {PTE_PACKAGES.map(pkg => {
              const active = selectedPkg === pkg.id;
              const t = pkgTheme(pkg.id);
              const x = pkgExtras(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card transition-all ${
                    active
                      ? `${t.borderStrong} ring-2 ${t.ring} shadow-xl`
                      : `${t.borderSoft} shadow-sm hover:-translate-y-1 hover:shadow-xl`
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-600 shadow">
                      <Star className="h-3 w-3 fill-violet-500 text-violet-500" /> Most Popular
                    </span>
                  )}

                  {/* Coloured header band */}
                  <div className={`relative bg-gradient-to-br ${t.band} px-6 pb-5 pt-6 text-white`}>
                    <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Course Fee</p>
                    <h3 className="mt-0.5 text-2xl font-black leading-tight">{pkg.name}</h3>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-black leading-none">{formatLkr(pkg.price)}</span>
                      <span className="mb-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">{x.feeTag}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/85">{pkg.tagline}</p>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {/* Hours equation */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {x.breakdown.map((b, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-base font-black text-muted-foreground">+</span>}
                          <div className={`min-w-[46px] rounded-xl ${BOX_COLORS[i % BOX_COLORS.length]} px-2.5 py-1.5 text-center text-white`}>
                            <div className="text-base font-black leading-none">{b.value}</div>
                            <div className="text-[8px] font-bold uppercase tracking-wide">{b.unit}</div>
                          </div>
                        </React.Fragment>
                      ))}
                      <span className="text-base font-black text-muted-foreground">=</span>
                      <div className="min-w-[46px] rounded-xl bg-slate-900 px-2.5 py-1.5 text-center text-white">
                        <div className="text-base font-black leading-none">{pkg.totalHours}</div>
                        <div className="text-[8px] font-bold uppercase tracking-wide">Guided</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-medium text-muted-foreground">
                      {x.breakdown.map((b, i) => <span key={i}>{b.value} {b.unit} · {b.label}</span>)}
                    </div>

                    {/* Features */}
                    <ul className="mt-5 space-y-2.5 flex-1">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${t.softBg}`}>
                            <Check className={`h-3 w-3 ${t.check}`} />
                          </span>
                          <span>
                            <span className="text-sm font-semibold">{f.title}</span>
                            <span className="block text-xs text-muted-foreground">{f.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className={`mt-5 rounded-xl ${t.softBg} p-3`}>
                      <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Best for</p>
                      <p className="mt-1 text-xs">{pkg.bestFor}</p>
                    </div>

                    <button
                      onClick={() => { setSelectedPkg(pkg.id); document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                        active ? t.btnActive : t.btnIdle
                      }`}
                    >
                      {active ? <><CheckCircle2 className="h-4 w-4" /> Selected</> : <>Register Now <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section className="pb-4">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="p-3 font-semibold">What you get</th>
                  {PTE_PACKAGES.map(p => (
                    <th key={p.id} className={`p-3 font-bold text-center border-b-2 ${pkgTheme(p.id).borderStrong} ${pkgTheme(p.id).softBg} ${pkgTheme(p.id).header}`}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 text-muted-foreground">Coaching hours</td>
                  {PTE_PACKAGES.map(p => <td key={p.id} className="p-3 text-center">{p.hoursLabel}</td>)}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">Total coaching & mentorship</td>
                  {PTE_PACKAGES.map(p => <td key={p.id} className={`p-3 text-center font-semibold ${pkgTheme(p.id).header}`}>{p.totalHours} hrs</td>)}
                </tr>
                <tr>
                  <td className="p-3 text-muted-foreground">Programme fee</td>
                  {PTE_PACKAGES.map(p => <td key={p.id} className={`p-3 text-center font-bold ${pkgTheme(p.id).header}`}>{formatLkr(p.price)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Registration ─────────────────────────────────────────────────── */}
      <section id="register" className="py-14 md:py-16 bg-muted/30 scroll-mt-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-headline font-bold">Register & Reserve Your Seat</h2>
            <p className="mt-2 text-muted-foreground">Pick your batch, confirm your details and pay securely via PayHere.</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-7">
            {/* Step 1 — package */}
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4 text-primary" /> 1. Selected package</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PTE_PACKAGES.map(p => {
                  const pt = pkgTheme(p.id);
                  return (
                    <button key={p.id} onClick={() => setSelectedPkg(p.id)}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${selectedPkg === p.id ? `${pt.borderStrong} ${pt.softBg}` : 'border-border hover:border-muted-foreground/30'}`}>
                      <span className={`text-sm font-semibold ${selectedPkg === p.id ? pt.header : ''}`}>{p.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatLkr(p.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — batch */}
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-3"><CalendarDays className="h-4 w-4 text-primary" /> 2. Choose your batch</p>
              {batchesLoading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading available batches…</p>
              ) : availableBatches.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {selectedPkg ? 'No open batches for this package right now.' : 'No open batches right now.'} Please check back soon or contact us on <b>077 453 3233</b>.
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableBatches.map(b => {
                    const left = seatsLeft(b);
                    const full = left === 0;
                    const chosen = selectedBatch === b.id;
                    return (
                      <button key={b.id} disabled={full} onClick={() => setSelectedBatch(b.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chosen ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'hover:border-primary/40'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-sm">{b.name}</span>
                          <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${b.mode === 'hybrid' ? 'bg-accent-4/15 text-accent-4' : 'bg-primary/10 text-primary'}`}>{b.mode}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {b.startDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Starts {b.startDate}</span>}
                          {b.schedule && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.schedule}</span>}
                          {b.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</span>}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {left === null ? 'Seats available' : full ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}</span>
                        </div>
                        {b.note && <p className="mt-1.5 text-xs text-muted-foreground/80">{b.note}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3 — details */}
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-3"><Phone className="h-4 w-4 text-primary" /> 3. Your details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name"
                  className="rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Contact number (WhatsApp)" inputMode="tel"
                  className="rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">We add you to your batch WhatsApp group using this number.</p>
            </div>

            {/* Non-refundable notice */}
            <label className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 cursor-pointer dark:border-red-800 dark:bg-red-950/30">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">
                <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> Non-refundable payment</span>
                I understand this programme fee is <b>strictly non-refundable under any circumstances</b> once paid. No refunds will be issued for any reason.
              </span>
            </label>

            {/* Summary + pay */}
            {chosenPkg && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total — {chosenPkg.name}</span>
                <span className="text-lg font-bold">{formatLkr(chosenPkg.price)}</span>
              </div>
            )}

            <button onClick={handleRegister} disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting secure checkout…</>
                : <><ShieldCheck className="h-4 w-4" /> {user ? 'Pay & Reserve My Seat' : 'Sign in to Register'}</>}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Secure payment powered by PayHere. You'll receive a receipt and access instructions by email.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Prefer to talk first? Call <b>077 453 3233</b> or visit us in Rajagiriya &amp; Wattala.{' '}
            <Link href="/contact" className="text-primary underline">Contact us</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function PteRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <RegistrationInner />
    </Suspense>
  );
}
