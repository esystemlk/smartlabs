'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Loader2, Receipt, CheckCircle2, Clock3 } from 'lucide-react';

interface Payment {
  orderId: string; course: string; type: string; amount: number; status: string; batchName: string; addOns: string[]; createdAtMs: number;
}

const lkr = (n: number) => 'LKR ' + Math.round(n || 0).toLocaleString('en-LK');
const fmtDate = (ms: number) => { try { return ms ? new Date(ms).toLocaleDateString() : '—'; } catch { return '—'; } };

const STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600' },
  amount_mismatch: { label: 'Amount issue', cls: 'bg-red-100 text-red-700' },
  chargedback: { label: 'Charged back', cls: 'bg-red-100 text-red-700' },
};

export function MyPayments() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/account/payments', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (active && res.ok) setPayments(data.payments ?? []);
        else if (active) setPayments([]);
      } catch { if (active) setPayments([]); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  // Hide the section entirely when there's nothing to show.
  if (!loading && (!payments || payments.length === 0)) return null;

  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Receipt className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-black text-foreground">My Payments</h2>
          <p className="text-xs text-muted-foreground">Your course registrations and payments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-2.5">
          {payments!.map((p) => {
            const s = STATUS[p.status] ?? STATUS.pending;
            const enrolled = p.status === 'success';
            const batchLine = p.type === 'ielts_course' && enrolled && !p.batchName
              ? 'Awaiting batch — we’ll contact you by email & WhatsApp'
              : p.batchName || '';
            return (
              <div key={p.orderId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{p.course}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {enrolled ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                    <span>{fmtDate(p.createdAtMs)}</span>
                    {p.addOns.length > 0 && <span>· + {p.addOns.join(', ')}</span>}
                    {batchLine && <span>· {batchLine}</span>}
                  </div>
                </div>
                <div className="text-sm font-black text-foreground">{lkr(p.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
