'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Gift, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Account = { uid: string; email: string; displayName: string; paid: number; unlimited: boolean };
type Grant = { targetUid: string; email: string; amount: number; note: string; requestId: string };

export function MockCreditManager() {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState<Account | null>(null);
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Grant | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);

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
      const response = await request(`/api/admin/manage-mock-credits?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not find this account.');
      setTarget(data); setAmount('1'); setNote('');
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
    inFlight.current = true;
    setBusy(true); setError(''); setSuccess('');
    try {
      // Preserve the exact request after a network failure so Retry cannot add twice.
      const payload = pending ?? { targetUid: target.uid, email: target.email, amount: count, note: note.trim(), requestId: crypto.randomUUID() };
      setPending(payload);
      const response = await request('/api/admin/manage-mock-credits', { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status < 500) setPending(null);
        throw new Error(data.error || 'Could not confirm the grant. Retry to check it safely.');
      }
      setTarget(previous => previous ? { ...previous, paid: data.paid } : previous);
      setPending(null);
      setSuccess(`${payload.amount} mock test credit${payload.amount === 1 ? '' : 's'} ${data.duplicate ? 'already added' : 'added'} to ${target.email}. Balance: ${data.paid}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection lost. Retry to confirm the same grant safely.');
    } finally { inFlight.current = false; setBusy(false); }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-5" aria-labelledby="mock-credits-title">
      <div>
        <h2 id="mock-credits-title" className="flex items-center gap-2 text-lg font-bold"><Gift className="h-5 w-5 text-violet-600" /> Give mock credits</h2>
        <p className="mt-1 text-sm text-muted-foreground">Find a registered user by email and add credits for mock tests. One credit starts one mock attempt. Admins and developers only.</p>
      </div>
      <form onSubmit={search} className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Label htmlFor="mock-credit-email">User’s email</Label>
          <Input id="mock-credit-email" type="email" required autoComplete="off" placeholder="student@example.com" value={email} disabled={busy || !!pending}
            onChange={event => { setEmail(event.target.value); setTarget(null); setError(''); setSuccess(''); }} />
        </div>
        <Button type="submit" variant="outline" disabled={busy || !!pending || !user}>{busy && !target ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Find user</Button>
      </form>
      {target && (
        <form onSubmit={grant} className="rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="min-w-0"><p className="font-bold break-words">{target.displayName}</p><p className="text-sm text-muted-foreground break-all">{target.email}</p></div>
            <div><p className="text-sm text-muted-foreground">Mock credits</p><p className="text-2xl font-black text-violet-600">{target.paid}</p></div>
          </div>
          {target.unlimited && <p className="text-sm text-muted-foreground">This account currently has unlimited mock access. Added credits will remain in its balance.</p>}
          <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
            <div className="space-y-2"><Label htmlFor="mock-credit-amount">Credits to add</Label><Input id="mock-credit-amount" type="number" min={1} max={1000} step={1} required value={amount} disabled={busy || !!pending} onChange={event => { setAmount(event.target.value); setSuccess(''); }} /></div>
            <div className="space-y-2"><Label htmlFor="mock-credit-note">Note (optional)</Label><Input id="mock-credit-note" maxLength={300} placeholder="e.g. Course package or offline payment" value={note} disabled={busy || !!pending} onChange={event => { setNote(event.target.value); setSuccess(''); }} /></div>
          </div>
          <Button type="submit" disabled={busy || !user || !!success} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}{success ? 'Credits added' : pending ? 'Retry same grant' : 'Add mock credits'}</Button>
          {pending && !busy && <p className="text-sm text-muted-foreground">The result is not confirmed yet. Retry this grant to check it without adding credits twice.</p>}
        </form>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5 shrink-0" /><span className="break-words min-w-0">{success}</span></p>}
    </section>
  );
}
