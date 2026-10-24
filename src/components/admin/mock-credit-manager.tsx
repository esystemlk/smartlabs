'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Gift, Loader2, Search, CheckCircle2, ReceiptText } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ExamType = 'pte' | 'ielts';
type Account = { uid: string; email: string; displayName: string; paid: number; unlimited: boolean };
type Payment = { reference: string; method: string; amountLkr: number | null };
type Grant = { targetUid: string; email: string; amount: number; note: string; requestId: string; examType: ExamType; payment?: Payment };

export function MockCreditManager({ examType = 'pte', institutePayments = false }: { examType?: ExamType; institutePayments?: boolean }) {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState<Account | null>(null);
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Grant | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);
  const name = examType.toUpperCase();
  const prefix = `mock-credit-${examType}`;
  const dark = institutePayments;
  const muted = dark ? 'text-slate-400' : 'text-muted-foreground';
  const inputStyle = dark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500' : '';
  const accent = examType === 'pte' ? 'text-violet-500' : 'text-sky-500';
  const actionStyle = examType === 'pte' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white';

  async function request(url: string, init?: RequestInit) {
    if (!user) throw new Error('Sign in with your admin account first.');
    const token = await user.getIdToken();
    return fetch(url, { ...init, cache: 'no-store', headers: {
      'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
    } });
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || pending) return;
    inFlight.current = true;
    setBusy(true); setError(''); setSuccess(''); setTarget(null);
    try {
      const response = await request(`/api/admin/manage-mock-credits?examType=${examType}&email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not find this account.');
      setTarget(data); setAmount('1'); setNote(''); setReference(''); setPaymentAmount(''); setPaymentMethod('cash');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not look up this account.');
    } finally { inFlight.current = false; setBusy(false); }
  }

  async function grant(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !target || success) return;
    const count = Number(amount);
    if (!Number.isSafeInteger(count) || count < 1 || count > 1000) {
      setError('Enter a whole number from 1 to 1,000.'); return;
    }
    const amountLkr = paymentAmount.trim() ? Number(paymentAmount) : null;
    if (institutePayments && (!reference.trim() || (amountLkr !== null && (!Number.isFinite(amountLkr) || amountLkr <= 0 || amountLkr > 10000000 || Math.abs(amountLkr * 100 - Math.round(amountLkr * 100)) > 0.00001)))) {
      setError('Enter an institute receipt / bank reference and a valid positive payment amount, or leave the amount blank.'); return;
    }
    inFlight.current = true;
    setBusy(true); setError(''); setSuccess('');
    try {
      // Preserve the exact request after a network failure so Retry cannot add twice.
      const payload: Grant = pending ?? { targetUid: target.uid, email: target.email, amount: count, note: note.trim(), requestId: crypto.randomUUID(), examType,
        ...(institutePayments ? { payment: { reference: reference.trim(), method: paymentMethod, amountLkr } } : {}),
      };
      setPending(payload);
      const response = await request('/api/admin/manage-mock-credits', { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status < 500) setPending(null);
        throw new Error(data.error || 'Could not confirm the grant. Retry to check it safely.');
      }
      setTarget(previous => previous ? { ...previous, paid: data.paid } : previous);
      setPending(null);
      setSuccess(`${payload.amount} ${name} mock test credit${payload.amount === 1 ? '' : 's'} ${data.duplicate ? 'already recorded' : 'added'} for ${target.email}. ${name} balance: ${data.paid}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost. Retry to confirm the same grant safely.');
    } finally { inFlight.current = false; setBusy(false); }
  }

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${dark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-card'}`} aria-labelledby={`${prefix}-title`}>
      <div>
        <h2 id={`${prefix}-title`} className="flex items-center gap-2 text-lg font-bold"><Gift className={`h-5 w-5 ${accent}`} /> {institutePayments ? `${name} mock credits · Institute payments` : `Give ${name} mock credits`}</h2>
        <p className={`mt-2 text-sm leading-6 ${muted}`}>Find any registered student by email, including students with zero credits. One credit starts one {name} mock attempt. Admins and developers only.</p>
        {institutePayments && <p className={`mt-2 text-xs leading-6 ${muted}`}>Record a payment already received by your institute. This adds only {name} mock credits; universal AI credits and the other mock pool stay unchanged.</p>}
      </div>
      <form onSubmit={search} className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Label htmlFor={`${prefix}-email`}>Student’s registered email</Label>
          <Input id={`${prefix}-email`} type="email" required autoComplete="off" placeholder="student@example.com" value={email} disabled={busy || !!pending} className={inputStyle}
            onChange={event => { setEmail(event.target.value); setTarget(null); setError(''); setSuccess(''); }} />
        </div>
        <Button type="submit" variant="outline" className={dark ? 'bg-slate-950 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white' : ''} disabled={busy || !!pending || !user}>{busy && !target ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Find student</Button>
      </form>
      {target && (
        <form onSubmit={grant} className={`rounded-xl border p-4 sm:p-5 space-y-5 ${dark ? 'bg-slate-950/50 border-slate-700' : 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900'}`}>
          <div className="flex flex-wrap justify-between gap-3">
            <div className="min-w-0"><p className="font-bold break-words">{target.displayName}</p><p className={`text-sm break-all ${muted}`}>{target.email}</p></div>
            <div><p className={`text-xs ${muted}`}>{name} mock balance</p><p className={`text-3xl font-black ${accent}`}>{target.paid}</p></div>
          </div>
          {target.unlimited && <p className={`text-sm ${muted}`}>This account currently has unlimited {name} mock access. Added credits will remain in its balance.</p>}
          <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
            <div className="space-y-2"><Label htmlFor={`${prefix}-amount`}>Credits to add</Label><Input id={`${prefix}-amount`} type="number" min={1} max={1000} step={1} required value={amount} className={inputStyle} disabled={busy || !!pending} onChange={event => { setAmount(event.target.value); setSuccess(''); }} /></div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-note`}>Internal note (optional)</Label><Input id={`${prefix}-note`} maxLength={300} placeholder="e.g. Student package or course enrollment" value={note} className={inputStyle} disabled={busy || !!pending} onChange={event => { setNote(event.target.value); setSuccess(''); }} /></div>
          </div>
          {institutePayments && <fieldset className="border-t border-slate-800 pt-4 space-y-4" disabled={busy || !!pending}>
            <legend className={`px-1 text-xs font-bold ${muted}`}><ReceiptText className="mr-2 inline h-4 w-4" />Institute payment record</legend>
            <div className="space-y-2"><Label htmlFor={`${prefix}-reference`}>Institute receipt / bank reference</Label><Input id={`${prefix}-reference`} required maxLength={120} value={reference} className={inputStyle} placeholder="e.g. SL-2026-00421" onChange={e => { setReference(e.target.value); setSuccess(''); }} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${prefix}-payment-amount`}>Amount received · LKR (optional)</Label><Input id={`${prefix}-payment-amount`} type="number" min="0.01" max="10000000" step="0.01" value={paymentAmount} className={inputStyle} placeholder="e.g. 6500.00" onChange={e => { setPaymentAmount(e.target.value); setSuccess(''); }} /></div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-method`}>Payment method</Label><select id={`${prefix}-method`} value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setSuccess(''); }} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"><option value="cash">Cash at institute</option><option value="bank_transfer">Bank transfer / deposit</option><option value="card">Card at institute</option><option value="other">Other institute payment</option></select></div></div>
            <p className={`text-xs leading-6 ${muted}`}>The receipt is recorded in the admin audit log. Reusing the same reference for this student’s {name} mock pool will not add the credits twice.</p>
          </fieldset>}
          <Button type="submit" disabled={busy || !user || !!success} className={`w-full sm:w-auto ${actionStyle}`}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}{success ? 'Credits recorded' : pending ? 'Retry same grant' : `Add ${name} mock credits`}</Button>
          {pending && !busy && <p className={`text-sm ${muted}`}>The result is not confirmed yet. Retry this grant to check it without adding credits twice.</p>}
        </form>
      )}
      {error && <p role="alert" className={`text-sm ${dark ? 'text-red-300' : 'text-destructive'}`}>{error}</p>}
      {success && <p role="status" className={`flex items-start gap-2 text-sm ${dark ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-400'}`}><CheckCircle2 className="h-5 w-5 shrink-0" /><span className="break-words min-w-0">{success}</span></p>}
    </section>
  );
}
