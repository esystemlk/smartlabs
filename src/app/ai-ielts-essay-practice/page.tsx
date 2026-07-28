'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { IeltsEssayResultView } from '@/components/ielts-essay/IeltsEssayResult';
import {
  IELTS_ESSAY_TOPICS, IELTS_ESSAY_CATEGORIES, IELTS_PREDICTION_THEMES,
  type IeltsEssayTopic,
} from '@/lib/ielts-essay-data';
import { IELTS_ESSAY_PACKAGES } from '@/lib/ielts-essay-packages';
import { payhereUrls } from '@/lib/payhere';
import type { IeltsEssayResult } from '@/types/ielts-essay';
import {
  Loader2, PenLine, Sparkles, Target, ArrowLeft, Lightbulb, ShieldAlert, RotateCcw,
  CreditCard, X, Check,
} from 'lucide-react';

const CRIMSON = '#dc2626';
const RECOMMENDED_MIN = 250; // IELTS Task 2 minimum

type Phase = 'setup' | 'writing' | 'scoring' | 'result';

const wordsOf = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function IeltsEssayPractice() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState<string>('All');
  const [topic, setTopic] = useState<IeltsEssayTopic | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [essay, setEssay] = useState('');
  const [targetBand, setTargetBand] = useState<number | null>(null);
  const [result, setResult] = useState<IeltsEssayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needCredits, setNeedCredits] = useState(false);

  // Purchase flow
  const [showBuy, setShowBuy] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  // Auto-submit the PayHere form once the signed params arrive.
  useEffect(() => {
    if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit();
  }, [payhereParams]);

  async function buy(packageId: string) {
    if (!user) { router.push('/login?redirect=/ai-ielts-essay-practice'); return; }
    setBuyingId(packageId);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ielts-essay-credits/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.params) throw new Error(data.error || 'Could not start checkout.');
      setPayhereParams(data.params); // effect submits to PayHere
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
      setBuyingId(null);
    }
  }

  const topics = useMemo(
    () => IELTS_ESSAY_TOPICS
      .filter(t => category === 'All' || t.category === category)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    [category]
  );

  const activePrompt = topic?.prompt ?? customTopic.trim();
  const words = wordsOf(essay);

  async function submit() {
    if (!user) { router.push('/login?redirect=/ai-ielts-essay-practice'); return; }
    if (!activePrompt) { setError('Choose a question or type your own first.'); return; }
    if (words < 50) { setError('Please write a fuller essay before scoring (at least 50 words).'); return; }

    setError(null);
    setNeedCredits(false);
    setPhase('scoring');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/score-ielts-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ topic: activePrompt, essay, wordCount: words, targetBand }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NO_IELTS_CREDITS') { setNeedCredits(true); setPhase('writing'); setError(data.error); return; }
        if (data.code === 'UNAUTHENTICATED' || data.code === 'SESSION_EXPIRED') {
          router.push('/login?redirect=/ai-ielts-essay-practice'); return;
        }
        throw new Error(data.error || 'Could not score your essay.');
      }
      setResult(data as IeltsEssayResult);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPhase('writing');
    }
  }

  function reset() {
    setResult(null); setEssay(''); setTopic(null); setCustomTopic('');
    setTargetBand(null); setError(null); setNeedCredits(false); setPhase('setup');
  }

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white">
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CRIMSON }}>
            <PenLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: CRIMSON }}>IELTS Writing Task 2</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Essay Trainer</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Instant band scoring on all four official criteria — Task Response, Coherence &amp; Cohesion,
          Lexical Resource, and Grammatical Range &amp; Accuracy.
        </p>
        <div className="mb-8">
          <button
            onClick={() => setShowBuy(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
          >
            <CreditCard size={13} /> Buy credits
          </button>
        </div>

        {/* ── SETUP: pick a question ─────────────────────────────────────── */}
        {phase === 'setup' && (
          <div className="space-y-6">
            {/* Prediction themes */}
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} style={{ color: CRIMSON }} />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Predicted hot themes</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {IELTS_PREDICTION_THEMES.map(t => (
                  <div key={t.area}>
                    <p className="text-xs font-black text-slate-800 mb-1">{t.area}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.topics.map(x => (
                        <span key={x} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-red-100 text-slate-600">{x}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              {['All', ...IELTS_ESSAY_CATEGORIES].map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    category === c ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={category === c ? { backgroundColor: CRIMSON } : undefined}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Question list */}
            <div className="space-y-3">
              {topics.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTopic(t); setCustomTopic(''); setPhase('writing'); }}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: CRIMSON, backgroundColor: '#fee2e2' }}>{t.type}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{t.category} · {t.source}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line line-clamp-3">{t.prompt}</p>
                </button>
              ))}
            </div>

            {/* Custom topic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Or write your own question</p>
              <textarea
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                rows={2}
                placeholder="Paste any IELTS Task 2 question here…"
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30"
              />
              <button
                onClick={() => { if (customTopic.trim()) { setTopic(null); setPhase('writing'); } }}
                disabled={!customTopic.trim()}
                className="mt-2 text-sm font-bold text-white px-4 py-2 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: CRIMSON }}
              >
                Use this question
              </button>
            </div>
          </div>
        )}

        {/* ── WRITING ────────────────────────────────────────────────────── */}
        {phase === 'writing' && (
          <div className="space-y-4">
            <button onClick={() => setPhase('setup')} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700">
              <ArrowLeft size={15} /> Change question
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Your question</p>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{activePrompt}</p>
            </div>

            <textarea
              value={essay}
              onChange={e => setEssay(e.target.value)}
              rows={16}
              autoFocus
              placeholder="Write your essay here…"
              className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-400/30"
            />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className={`text-xs font-bold ${words < RECOMMENDED_MIN ? 'text-amber-600' : 'text-emerald-600'}`}>
                {words} words {words < RECOMMENDED_MIN && `· aim for ${RECOMMENDED_MIN}+`}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Target size={13} /> Target</span>
                {[6, 6.5, 7, 7.5, 8].map(b => (
                  <button
                    key={b}
                    onClick={() => setTargetBand(targetBand === b ? null : b)}
                    className={`text-xs font-bold w-9 h-8 rounded-lg border transition-colors ${
                      targetBand === b ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                    style={targetBand === b ? { backgroundColor: CRIMSON } : undefined}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
                <ShieldAlert size={15} /> {error}
              </p>
            )}
            {needCredits && (
              <button onClick={() => setShowBuy(true)} className="inline-flex items-center gap-1.5 text-sm font-bold underline" style={{ color: CRIMSON }}>
                <CreditCard size={15} /> Buy IELTS essay credits →
              </button>
            )}

            <button
              onClick={submit}
              className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: CRIMSON }}
            >
              <Sparkles size={16} /> Score my essay
            </button>
          </div>
        )}

        {/* ── SCORING ────────────────────────────────────────────────────── */}
        {phase === 'scoring' && (
          <div className="py-24 flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: CRIMSON }} />
            <p className="text-sm font-black text-slate-700">Marking your essay like an IELTS examiner…</p>
            <p className="text-xs text-slate-400 mt-1">This usually takes 15–30 seconds.</p>
          </div>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────── */}
        {phase === 'result' && result && (
          <div className="space-y-6">
            <IeltsEssayResultView result={result} />
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={reset} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm" style={{ backgroundColor: CRIMSON }}>
                <RotateCcw size={15} /> New essay
              </button>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm">
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Purchase modal ─────────────────────────────────────────────── */}
      {showBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !buyingId && setShowBuy(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-black text-slate-900">IELTS Essay Credits</h2>
              <button onClick={() => !buyingId && setShowBuy(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Each credit scores one essay on all four IELTS criteria.</p>
            <div className="space-y-3">
              {IELTS_ESSAY_PACKAGES.map(p => (
                <div key={p.id} className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${p.popular ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900">{p.label}</p>
                      {p.popular && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CRIMSON }}>Popular</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.scoring === -1 ? `Unlimited scoring for ${p.monthlyDays} days` : `${p.scoring} essay scorings`}
                    </p>
                  </div>
                  <button
                    onClick={() => buy(p.id)}
                    disabled={!!buyingId}
                    className="px-4 py-2.5 rounded-xl text-white font-black text-sm whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: CRIMSON }}
                  >
                    {buyingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    LKR {p.price.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">Secure payment via PayHere. You&apos;ll be redirected to complete checkout.</p>
          </div>
        </div>
      )}

      {/* Hidden PayHere auto-submit form */}
      {payhereParams && (
        <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} style={{ display: 'none' }}>
          {Object.entries(payhereParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}
    </div>
  );
}
