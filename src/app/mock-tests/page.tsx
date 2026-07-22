'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import { MOCK_PACKAGES } from '@/lib/mock-packages';
import { formatDuration } from '@/types/mock-test';
import {
  ArrowRight, BookOpen, Clock, Loader2, PenLine, CreditCard, X, Zap,
  Infinity as InfinityIcon, PlayCircle, Award, Lock,
} from 'lucide-react';

interface MockSummary {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalSeconds: number;
}

/** The two legacy reading practice tests — unchanged, still free. */
const READING_TESTS = [
  {
    title: 'PTE Academic Mock Test 1',
    description: 'Full-length reading practice to simulate the real exam experience.',
    href: '/mock-tests/pte/test-1',
  },
  {
    title: 'PTE Academic Mock Test 2',
    description: 'A second reading practice test to sharpen your skills.',
    href: '/mock-tests/pte/test-2',
  },
];

function MockTestsInner() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mocks, setMocks] = useState<MockSummary[]>([]);
  const [inProgress, setInProgress] = useState<Record<string, string>>({});
  const [needsScoring, setNeedsScoring] = useState<Record<string, string>>({});
  const [lastResults, setLastResults] = useState<Record<string, { attemptId: string; band: number }>>({});
  const [credits, setCredits] = useState<{ unlimited: boolean; remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [showBuy, setShowBuy] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mock/list', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (res.ok) {
        setMocks(d.mocks ?? []);
        setCredits(d.credits ?? null);
        const ip: Record<string, string> = {};
        (d.inProgress ?? []).forEach((x: { mockId: string; attemptId: string }) => { ip[x.mockId] = x.attemptId; });
        setInProgress(ip);
        const ns: Record<string, string> = {};
        (d.needsScoring ?? []).forEach((x: { mockId: string; attemptId: string }) => { ns[x.mockId] = x.attemptId; });
        setNeedsScoring(ns);
        setLastResults(d.lastResults ?? {});
      }
    } catch { /* leave empty */ } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (!isUserLoading) void load(); }, [isUserLoading, load]);

  // Payment return
  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') { toast({ title: 'Payment successful!', description: 'Mock credits added to your account.' }); void load(); }
    else if (p === 'cancelled') { toast({ title: 'Payment cancelled', variant: 'destructive' }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const buy = async (packageId: string) => {
    if (!user) { router.push('/login?redirect=/mock-tests'); return; }
    setBuying(packageId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mock-credits/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) { toast({ variant: 'destructive', title: d.error || 'Payment setup failed' }); return; }
      setPayhereParams(d.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally {
      setBuying(null);
    }
  };

  const remaining = credits?.unlimited ? -1 : credits?.remaining ?? 0;

  return (
    <div className="w-full">
      {/* Hidden PayHere form */}
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Mock Tests</h1>
            <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Full-length, timed practice under real exam conditions — marked automatically by our AI.
            </p>
          </div>

          {/* Credits bar */}
          {user && credits && (
            <div className="max-w-5xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mock Credits</p>
                  <p className="text-lg font-black text-violet-700">
                    {credits.unlimited
                      ? <span className="inline-flex items-center gap-1"><InfinityIcon className="h-4 w-4" /> Unlimited</span>
                      : `${remaining} available`}
                  </p>
                </div>
              </div>
              {!credits.unlimited && (
                <button onClick={() => setShowBuy(true)} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm px-5 py-3 rounded-xl">
                  <CreditCard size={15} /> Buy Credits
                </button>
              )}
            </div>
          )}

          {/* ── AI-scored writing mocks ── */}
          <div className="max-w-5xl mx-auto mb-14">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="h-4 w-4 text-violet-600" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">AI-Scored Writing Mock</h2>
            </div>

            {isUserLoading || loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
                <Loader2 className="animate-spin" size={18} /> Loading mock tests…
              </div>
            ) : !user ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Lock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Sign in to take a mock test</p>
                <Link href="/login?redirect=/mock-tests" className="mt-4 inline-block px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">
                  Sign In
                </Link>
              </div>
            ) : mocks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-slate-600 font-bold">No mock tests available yet.</p>
                <p className="text-slate-400 text-sm mt-1">New mocks are published by the Smart Labs team — check back soon.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {mocks.map(m => {
                  const resumeId = inProgress[m.id];
                  const scoringId = needsScoring[m.id];
                  const last = lastResults[m.id];
                  return (
                    <div key={m.id} className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900">{m.title}</h3>
                        {last && (
                          <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
                            <Award size={11} /> Last: {last.band}
                          </span>
                        )}
                      </div>
                      {m.description && <p className="text-sm text-slate-500 leading-relaxed mb-4">{m.description}</p>}

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 mb-5">
                        <span className="inline-flex items-center gap-1.5"><BookOpen size={14} /> {m.totalQuestions} questions</span>
                        <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {formatDuration(m.totalSeconds)}</span>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {scoringId ? (
                          <Link href={`/mock/${m.id}`} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm">
                            <Award size={16} /> Get My Result
                          </Link>
                        ) : resumeId ? (
                          <Link href={`/mock/${m.id}`} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm">
                            <PlayCircle size={16} /> Resume Exam
                          </Link>
                        ) : last ? (
                          <Link href={`/mock/${m.id}`} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm">
                            <Award size={16} /> View Result
                          </Link>
                        ) : (
                          <Link href={`/mock/${m.id}`} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm">
                            Start Exam <ArrowRight size={16} />
                          </Link>
                        )}
                      </div>

                      {!credits?.unlimited && remaining === 0 && !resumeId && (
                        <p className="text-[11px] text-amber-700 mt-3">
                          You have no mock credits — you&apos;ll be asked to buy one when you start.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Legacy reading practice ── */}
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Reading Practice</h2>
              <span className="text-[10px] font-bold text-slate-400">· free</span>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {READING_TESTS.map(t => (
                <div key={t.href} className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col">
                  <h3 className="text-lg font-black text-slate-900">{t.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mt-1 mb-4">{t.description}</p>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-5">
                    <span className="inline-flex items-center gap-1.5"><Clock size={14} /> approx. 30 mins</span>
                  </div>
                  <Link href={t.href} className="mt-auto inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm">
                    Start Test <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Buy credits modal */}
      {showBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-violet-600" /> Buy Mock Credits
                </h2>
                <p className="text-slate-500 text-sm mt-1">One credit = one full mock test, marked by AI.</p>
              </div>
              <button onClick={() => setShowBuy(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-5">
              {MOCK_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`relative rounded-3xl border-2 p-5 ${pkg.popular ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200'}`}>
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                      Best Value
                    </span>
                  )}
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{pkg.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {(pkg.price / 1000).toFixed(pkg.price % 1000 === 0 ? 0 : 1)}k <span className="text-xs text-slate-400">LKR</span>
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-2 mb-4 inline-flex items-center gap-1.5">
                    <Zap size={13} className="text-violet-600" /> {pkg.credits} mock{pkg.credits > 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => buy(pkg.id)}
                    disabled={!!buying}
                    className="w-full py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {buying === pkg.id ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={15} />} Buy
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">🔒 Secured by PayHere · LKR</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockTestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>}>
      <MockTestsInner />
    </Suspense>
  );
}
