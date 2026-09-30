'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, Sparkles, Crown, Calculator, Users, Coins } from 'lucide-react';

/**
 * Tiered referral commission — resets every month.
 *  • Students 1–10   → 10%
 *  • Students 11–20  → 12%
 *  • Students 21+    → 15%
 * The calculator applies the rate marginally within each bracket.
 */
interface Tier {
  key: string; range: string; label: string; rate: number;
  icon: typeof TrendingUp; accent: string; ring: string; chip: string; note: string; popular?: boolean;
}
const TIERS: Tier[] = [
  { key: 't1', range: '1 – 10', label: 'students / month', rate: 10, icon: TrendingUp, accent: 'from-sky-500 to-blue-600', ring: 'ring-blue-200', chip: 'bg-blue-50 text-blue-700', note: 'Starter tier — every partner begins here each month.' },
  { key: 't2', range: '11 – 20', label: 'students / month', rate: 12, icon: Sparkles, accent: 'from-violet-500 to-indigo-600', ring: 'ring-indigo-200', chip: 'bg-indigo-50 text-indigo-700', note: 'From your 11th student, the rate steps up.', popular: true },
  { key: 't3', range: '20+', label: 'students / month', rate: 15, icon: Crown, accent: 'from-amber-500 to-orange-600', ring: 'ring-amber-200', chip: 'bg-amber-50 text-amber-700', note: 'Top tier — from your 21st student onward.' },
];

const LKR = (n: number) => 'LKR ' + Math.round(n).toLocaleString('en-LK');

function marginalEarnings(students: number, avgValue: number) {
  const t1 = Math.min(students, 10);
  const t2 = Math.min(Math.max(students - 10, 0), 10);
  const t3 = Math.max(students - 20, 0);
  const earnings = avgValue * (t1 * 0.10 + t2 * 0.12 + t3 * 0.15);
  const gross = avgValue * students;
  const effective = gross > 0 ? (earnings / gross) * 100 : 0;
  return { earnings, effective };
}

export function CommissionTiers() {
  const [students, setStudents] = useState(15);
  const [avg, setAvg] = useState(25000);
  const { earnings, effective } = useMemo(() => marginalEarnings(students, avg), [students, avg]);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(59,130,246,.25), transparent 70%)' }} />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-300 backdrop-blur">
            <Coins size={14} /> Tiered commission
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Earn more as you refer more</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            The more students you bring each month, the higher your commission climbs. Your tier resets at
            the start of every month, so every month is a fresh chance to reach the top rate.
          </p>
        </div>

        {/* Tier cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.key} className={`relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-transform hover:-translate-y-1 ${t.popular ? `ring-2 ${t.ring}` : ''}`}>
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                  Growth tier
                </span>
              )}
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.accent} text-white shadow-lg`}>
                <t.icon size={22} />
              </div>
              <div className="flex items-end gap-1">
                <span className="bg-gradient-to-br from-white to-slate-300 bg-clip-text text-5xl font-black text-transparent">{t.rate}</span>
                <span className="mb-1.5 text-2xl font-black text-slate-300">%</span>
              </div>
              <div className="mt-1 text-sm font-black text-white">commission</div>
              <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${t.chip}`}>
                <Users size={12} /> {t.range} <span className="font-bold opacity-70">{t.label}</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">{t.note}</p>
            </div>
          ))}
        </div>

        {/* Live earnings calculator */}
        <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-8">
          <div className="mb-6 inline-flex items-center gap-2 text-sm font-black text-white">
            <Calculator size={18} className="text-emerald-300" /> Estimate your monthly earnings
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                <span>Students / month</span><span className="text-white">{students}</span>
              </div>
              <input type="range" min={1} max={40} value={students} onChange={(e) => setStudents(+e.target.value)}
                className="mt-3 w-full accent-blue-500" />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>1</span><span>40</span></div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">Avg. course value (LKR)</div>
              <input type="number" min={0} step={1000} value={avg} onChange={(e) => setAvg(Math.max(0, +e.target.value))}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-blue-400" />
              <p className="mt-1 text-[10px] text-slate-500">Adjust to your typical enrolment fee.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent p-5 ring-1 ring-emerald-400/20">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-300">Estimated monthly commission</div>
              <div className="mt-1 text-3xl font-black text-white">{LKR(earnings)}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">Effective blended rate</div>
              <div className="mt-1 text-3xl font-black text-white">{effective.toFixed(1)}%</div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-500">
            Illustration only. Commission applies to confirmed enrolments and is calculated per bracket
            (1–10 @ 10%, 11–20 @ 12%, 20+ @ 15%). Actual payouts follow the partner agreement and are
            processed by SmartLabs. Tiers reset monthly.
          </p>
        </div>
      </div>
    </section>
  );
}
