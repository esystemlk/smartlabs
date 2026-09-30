'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { Handshake, Loader2, LogOut, MailCheck, Clock, CheckCircle2, XCircle, ShieldAlert, Pencil, Ban } from 'lucide-react';

interface Partner {
  fullName?: string; ref?: string; partnerType?: string; businessName?: string;
  reviewStatus?: string; accountState?: string; stateReason?: string;
}

interface Application {
  fullName?: string; phone?: string; location?: string; address?: string;
  businessName?: string; website?: string; businessRegNo?: string;
  referralDescription?: string; estimatedVolume?: string; reviewReason?: string;
}

const STATUS: Record<string, { label: string; tone: string; icon: typeof Clock; note: string }> = {
  pending: { label: 'Pending review', tone: 'bg-amber-100 text-amber-700', icon: Clock, note: 'Our team is reviewing your application. You’ll get an email when there’s an update.' },
  needs_info: { label: 'More info needed', tone: 'bg-orange-100 text-orange-700', icon: ShieldAlert, note: 'We’ve requested some corrections. Update your details below and resubmit.' },
  approved: { label: 'Approved', tone: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, note: 'Your partnership is approved. Your full referral workspace is coming soon.' },
  rejected: { label: 'Not approved', tone: 'bg-red-100 text-red-700', icon: XCircle, note: 'This application was not approved. You can correct your details below and resubmit for another review.' },
  withdrawn: { label: 'Withdrawn', tone: 'bg-slate-100 text-slate-600', icon: XCircle, note: 'This application was withdrawn.' },
};

const field = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function PartnerWorkspacePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);
  const [app, setApp] = useState<Application | null>(null);
  const [sent, setSent] = useState(false);

  // Resubmit form state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Application>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = async (uid: string) => {
    const pSnap = await getDoc(doc(firestore, 'partners', uid));
    const p = pSnap.exists() ? (pSnap.data() as Partner) : null;
    setPartner(p);
    if (p?.ref) {
      try {
        const aSnap = await getDoc(doc(firestore, 'partner_applications', p.ref));
        setApp(aSnap.exists() ? (aSnap.data() as Application) : null);
      } catch { setApp(null); }
    }
  };

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/partners/login'); return; }
    load(user.uid).catch(() => setPartner(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading, firestore, router]);

  const resend = async () => { if (user) { try { await sendEmailVerification(user); setSent(true); } catch { /* ignore */ } } };

  const startEdit = () => {
    setForm({
      fullName: app?.fullName ?? partner?.fullName ?? '',
      phone: app?.phone ?? '', location: app?.location ?? '', address: app?.address ?? '',
      businessName: app?.businessName ?? partner?.businessName ?? '',
      website: app?.website ?? '', businessRegNo: app?.businessRegNo ?? '',
      referralDescription: app?.referralDescription ?? '', estimatedVolume: app?.estimatedVolume ?? '',
    });
    setError(null); setEditing(true);
  };

  const submit = async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/partners/resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resubmit.');
      setEditing(false); setDone(true);
      await load(user.uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || partner === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (partner === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-slate-600">This isn’t a partner account. If you applied, sign in with your partner login.</p>
        <Link href="/partners/login" className="mt-4 inline-block rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white">Partner login</Link>
      </div>
    );
  }

  // Kill switch: a session that was open when the partner got banned/deactivated
  // (Firebase blocks the *next* sign-in; this locks the current session too).
  const accountState = partner.accountState ?? 'pending_activation';
  if (accountState === 'banned' || accountState === 'deactivated') {
    const permanent = accountState === 'banned';
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Ban size={26} /></div>
        <h1 className="text-xl font-black text-slate-900">{permanent ? 'Account closed' : 'Account deactivated'}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {permanent
            ? 'Your partner account has been permanently closed and access has been removed.'
            : 'Your partner account is temporarily deactivated. You cannot access the workspace until it is reactivated.'}
        </p>
        {partner.stateReason ? <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">Reason: {partner.stateReason}</p> : null}
        <p className="mt-4 text-xs text-slate-500">Questions? Email contact@smartlabs.lk</p>
        <button onClick={() => signOut(auth).then(() => router.replace('/partners/login'))} className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white"><LogOut size={15} /> Sign out</button>
      </div>
    );
  }

  const status = partner.reviewStatus ?? 'pending';
  const st = STATUS[status] ?? STATUS.pending;
  const verified = !!user?.emailVerified;
  const suspended = accountState === 'suspended';
  const canResubmit = status === 'needs_info' || status === 'rejected';
  const isBiz = partner.partnerType === 'business';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="inline-flex items-center gap-2 font-black text-slate-900"><Handshake size={18} className="text-blue-600" /> Partner Workspace</div>
          <button onClick={() => signOut(auth).then(() => router.replace('/partners/login'))} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900"><LogOut size={15} /> Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black">Hi {(partner.fullName ?? '').split(' ')[0] || 'there'}</h1>
        <p className="text-sm text-slate-600">{partner.businessName ? partner.businessName : isBiz ? 'Business partner' : 'Individual partner'} · Ref {partner.ref}</p>

        {/* Email verification banner */}
        {!verified && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><MailCheck size={18} /> Please verify your email to activate your account.</div>
            <button onClick={resend} disabled={sent} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-60">{sent ? 'Email sent' : 'Resend verification'}</button>
          </div>
        )}

        {suspended && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <ShieldAlert size={18} /> Your account is temporarily suspended while we review it. Referral tools are paused.{partner.stateReason ? ` Reason: ${partner.stateReason}` : ''}
          </div>
        )}

        {done && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} /> Your updated application has been resubmitted for review.
          </div>
        )}

        {/* Status card */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${st.tone}`}><st.icon size={13} /> {st.label}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{st.note}</p>

          {/* What the reviewer asked for / reason */}
          {canResubmit && app?.reviewReason && (
            <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-orange-700">{status === 'needs_info' ? 'What we need' : 'Reason'}</p>
              <p className="mt-1 text-sm text-orange-900">{app.reviewReason}</p>
            </div>
          )}

          {partner.reviewStatus === 'approved' && !verified && (
            <p className="mt-2 text-xs font-semibold text-amber-700">Verify your email above to unlock referral features.</p>
          )}

          {canResubmit && !editing && (
            <button onClick={startEdit} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
              <Pencil size={14} /> Update &amp; resubmit application
            </button>
          )}
        </div>

        {/* Edit / resubmit form */}
        {canResubmit && editing && (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black">Correct your details</h2>
            <p className="mt-1 text-sm text-slate-600">Fix what was flagged, then resubmit. Your username and email stay the same.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Full name *</span>
                <input className={`mt-1 ${field}`} value={form.fullName ?? ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Phone *</span>
                <input className={`mt-1 ${field}`} value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">District / city *</span>
                <input className={`mt-1 ${field}`} value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Address</span>
                <input className={`mt-1 ${field}`} value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              {isBiz && (
                <>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Business name *</span>
                    <input className={`mt-1 ${field}`} value={form.businessName ?? ''} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Business reg. no.</span>
                    <input className={`mt-1 ${field}`} value={form.businessRegNo ?? ''} onChange={(e) => setForm({ ...form, businessRegNo: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Website</span>
                    <input className={`mt-1 ${field}`} value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </label>
                </>
              )}
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-slate-600">How you’ll refer students</span>
                <textarea rows={3} className={`mt-1 ${field}`} value={form.referralDescription ?? ''} onChange={(e) => setForm({ ...form, referralDescription: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-slate-600">Estimated monthly referrals</span>
                <input className={`mt-1 ${field}`} value={form.estimatedVolume ?? ''} onChange={(e) => setForm({ ...form, estimatedVolume: e.target.value })} />
              </label>
            </div>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} {saving ? 'Resubmitting…' : 'Resubmit for review'}
              </button>
              <button onClick={() => { setEditing(false); setError(null); }} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">Need help? Email contact@smartlabs.lk</p>
      </div>
    </div>
  );
}
