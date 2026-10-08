'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import { IELTS_COURSE, formatLkr } from '@/lib/ielts-course';
import { Loader2, CheckCircle2, GraduationCap, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

function IeltsRegistration() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const paymentState = params.get('payment');

  useEffect(() => { if (user?.displayName && !fullName) setFullName(user.displayName); }, [user, fullName]);
  useEffect(() => { if (payhereParams && formRef.current) formRef.current.submit(); }, [payhereParams]);

  const handleRegister = async () => {
    if (!user) { router.push(`/login?redirect=/ielts-registration`); return; }
    if (fullName.trim().length < 2) { toast({ variant: 'destructive', title: 'Please enter your full name.' }); return; }
    if (phone.replace(/[^0-9+]/g, '').length < 9) { toast({ variant: 'destructive', title: 'Please enter a valid contact number.' }); return; }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ielts-registration/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName, phone }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) { toast({ variant: 'destructive', title: d.error || 'Could not start payment.' }); return; }
      setPayhereParams(d.params);
    } catch { toast({ variant: 'destructive', title: 'Network error. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  if (isUserLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <form ref={formRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      {paymentState === 'success' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>Payment received — thank you! Check your email for the receipt. Our team will share your batch details by email and WhatsApp shortly. You can also see this on <Link href="/dashboard" className="font-bold underline">your dashboard</Link>.</span>
        </div>
      )}
      {paymentState === 'cancelled' && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Payment was cancelled. You can try again below whenever you're ready.</div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600"><GraduationCap size={16} /> Smart Labs IELTS</div>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{IELTS_COURSE.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{IELTS_COURSE.tagline}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <div><div className="text-3xl font-black text-slate-900">{formatLkr(IELTS_COURSE.price)}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Course fee</div></div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600"><Clock size={15} className="text-blue-600" /> {IELTS_COURSE.durationLabel}</div>
        </div>

        <ul className="mt-5 space-y-2">
          {IELTS_COURSE.features.map((f) => (
            <li key={f.title} className="flex items-start gap-2 text-sm">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span><b className="text-slate-900">{f.title}</b><span className="text-slate-500"> — {f.detail}</span></span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Full name *</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Your full name" /></label>
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Contact number *</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="07X XXX XXXX" /></label>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">Batch dates aren't fixed yet — pay now to reserve your place, and we'll share your batch, start date and WhatsApp group by email and WhatsApp.</div>

        <button onClick={handleRegister} disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting secure checkout…</> : <>Pay {formatLkr(IELTS_COURSE.price)} &amp; register <ArrowRight size={16} /></>}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400"><ShieldCheck size={13} /> Secure payment via PayHere · Need help? Call 070 691 4652</p>
      </div>
    </div>
  );
}

export default function IeltsRegistrationPage() {
  return <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}><IeltsRegistration /></Suspense>;
}
