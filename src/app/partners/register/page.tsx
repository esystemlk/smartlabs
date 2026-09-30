'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, User, ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type PartnerType = 'business' | 'individual';
type Step = 'form' | 'review' | 'done';

interface Form {
  partnerType: PartnerType;
  fullName: string; username: string; email: string; phone: string; location: string; address: string;
  businessName: string; website: string; businessRegNo: string;
  referralDescription: string; estimatedVolume: string;
  password: string; confirmPassword: string;
  agreeTerms: boolean; agreePrivacy: boolean; agreeAuthority: boolean; agreeLogo: boolean;
}

const EMPTY: Form = {
  partnerType: 'business', fullName: '', username: '', email: '', phone: '', location: '', address: '',
  businessName: '', website: '', businessRegNo: '', referralDescription: '', estimatedVolume: '',
  password: '', confirmPassword: '', agreeTerms: false, agreePrivacy: false, agreeAuthority: false, agreeLogo: false,
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PartnerRegisterPage() {
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState('');

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const isBiz = f.partnerType === 'business';

  const validate = (): string | null => {
    if (f.fullName.trim().length < 2) return 'Enter your full name.';
    if (!USERNAME_RE.test(f.username.trim())) return 'Username must be 3–30 letters, numbers or underscores.';
    if (!EMAIL_RE.test(f.email.trim())) return 'Enter a valid email address.';
    if (f.phone.trim().length < 6) return 'Enter a valid phone number.';
    if (!f.location.trim()) return 'Enter your district or city.';
    if (isBiz && f.businessName.trim().length < 2) return 'Enter your business name.';
    if (f.password.length < 8) return 'Password must be at least 8 characters.';
    if (f.password !== f.confirmPassword) return 'Passwords do not match.';
    if (!f.agreeTerms || !f.agreePrivacy || !f.agreeAuthority) return 'Accept the required agreements.';
    if (isBiz && !f.agreeLogo) return 'Grant logo display permission.';
    return null;
  };

  const goReview = () => { const e = validate(); if (e) { setError(e); return; } setError(''); setStep('review'); };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not submit. Please try again.'); setStep('form'); return; }
      setRef(data.ref); setStep('done');
    } catch {
      setError('Network error — please try again.'); setStep('form');
    } finally { setBusy(false); }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32} /></div>
          <h1 className="text-2xl font-black">Application received</h1>
          <p className="mt-3 text-sm text-slate-600">
            Thanks, {f.fullName.split(' ')[0]}! Your reference is <b>{ref}</b>. We&apos;ve emailed you an
            acknowledgement (check spam too) and notified our team. Your application is <b>pending review</b>.
          </p>
          <p className="mt-2 text-sm text-slate-600">Verify your email using the link we sent, then sign in to track your status.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/partners/login" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-800">Partner login</Link>
            <Link href="/partners" className="rounded-2xl border-2 border-slate-300 px-6 py-3 text-sm font-black text-slate-800 hover:border-slate-900">Back to partners</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Partner programme</Link>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">Become a Partner</h1>
        <p className="mt-1 text-sm text-slate-600">{step === 'review' ? 'Review your details, then submit.' : 'Create your partner account. All fields marked required.'}</p>

        {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</div>}

        {step === 'review' ? (
          <div className="mt-6 space-y-3 rounded-3xl border border-slate-200 bg-white p-6">
            {([
              ['Type', isBiz ? 'Business' : 'Individual'], ['Full name', f.fullName], ['Username', f.username],
              ['Email', f.email], ['Phone', f.phone], ['Location', f.location], ...(f.address ? [['Address', f.address]] : []),
              ...(isBiz ? [['Business name', f.businessName], ...(f.website ? [['Website', f.website]] : []), ...(f.businessRegNo ? [['Reg. no.', f.businessRegNo]] : [])] : []),
              ...(f.referralDescription ? [['How you’ll refer', f.referralDescription]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-0">
                <span className="font-semibold text-slate-500">{k}</span><span className="text-right font-medium text-slate-900">{v}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-3">
              <button onClick={() => setStep('form')} disabled={busy} className="rounded-2xl border-2 border-slate-300 px-6 py-3 text-sm font-black text-slate-800 hover:border-slate-900">Edit</button>
              <button onClick={submit} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Submit application
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Type */}
            <div className="grid grid-cols-2 gap-3">
              {(['business', 'individual'] as PartnerType[]).map((t) => {
                const active = f.partnerType === t; const Icon = t === 'business' ? Building2 : User;
                return (
                  <button key={t} onClick={() => set('partnerType', t)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <Icon size={22} className={active ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="text-sm font-black capitalize">{t}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
              <Field label="Full name *"><input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} className={inp} placeholder="Your name" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Username *"><input value={f.username} onChange={(e) => set('username', e.target.value)} className={inp} placeholder="3–30 chars" /></Field>
                <Field label="Email *"><input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} className={inp} placeholder="you@example.com" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone *"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} className={inp} placeholder="07X XXX XXXX" /></Field>
                <Field label="District / City *"><input value={f.location} onChange={(e) => set('location', e.target.value)} className={inp} placeholder="e.g. Colombo" /></Field>
              </div>
              <Field label="Address (optional)"><input value={f.address} onChange={(e) => set('address', e.target.value)} className={inp} /></Field>

              {isBiz && (
                <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                  <Field label="Business name *"><input value={f.businessName} onChange={(e) => set('businessName', e.target.value)} className={inp} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Website (optional)"><input value={f.website} onChange={(e) => set('website', e.target.value)} className={inp} placeholder="https://" /></Field>
                    <Field label="Business reg. no. (optional)"><input value={f.businessRegNo} onChange={(e) => set('businessRegNo', e.target.value)} className={inp} /></Field>
                  </div>
                  <p className="text-xs text-slate-500">You&apos;ll upload your company logo from your partner workspace after approval.</p>
                </div>
              )}

              <Field label="How do you plan to refer students? (optional)">
                <textarea value={f.referralDescription} onChange={(e) => set('referralDescription', e.target.value)} rows={3} className={inp} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password *"><input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} className={inp} placeholder="Min 8 characters" /></Field>
                <Field label="Confirm password *"><input type="password" value={f.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className={inp} /></Field>
              </div>

              <div className="space-y-2 pt-1">
                <Check checked={f.agreeTerms} onChange={(v) => set('agreeTerms', v)} label="I accept the partnership terms." />
                <Check checked={f.agreePrivacy} onChange={(v) => set('agreePrivacy', v)} label="I acknowledge the privacy policy." />
                <Check checked={f.agreeAuthority} onChange={(v) => set('agreeAuthority', v)} label="I have the authority/consent to submit student details I refer." />
                {isBiz && <Check checked={f.agreeLogo} onChange={(v) => set('agreeLogo', v)} label="I grant SmartLabs permission to display my approved company logo." />}
              </div>
            </div>

            <button onClick={goReview} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white hover:bg-slate-800">
              Review application <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}
function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}
