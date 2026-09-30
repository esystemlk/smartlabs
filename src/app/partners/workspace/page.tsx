'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { Handshake, Loader2, LogOut, MailCheck, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface Partner {
  fullName?: string; ref?: string; partnerType?: string; businessName?: string;
  reviewStatus?: string; accountState?: string;
}

const STATUS: Record<string, { label: string; tone: string; icon: typeof Clock; note: string }> = {
  pending: { label: 'Pending review', tone: 'bg-amber-100 text-amber-700', icon: Clock, note: 'Our team is reviewing your application. You’ll get an email when there’s an update.' },
  needs_info: { label: 'More info needed', tone: 'bg-orange-100 text-orange-700', icon: ShieldAlert, note: 'We’ve requested some corrections — check your email for details.' },
  approved: { label: 'Approved', tone: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, note: 'Your partnership is approved. Your full referral workspace is coming soon.' },
  rejected: { label: 'Not approved', tone: 'bg-red-100 text-red-700', icon: XCircle, note: 'This application was not approved. Contact contact@smartlabs.lk for details.' },
  withdrawn: { label: 'Withdrawn', tone: 'bg-slate-100 text-slate-600', icon: XCircle, note: 'This application was withdrawn.' },
};

export default function PartnerWorkspacePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/partners/login'); return; }
    getDoc(doc(firestore, 'partners', user.uid))
      .then((snap) => setPartner(snap.exists() ? (snap.data() as Partner) : null))
      .catch(() => setPartner(null));
  }, [user, isUserLoading, firestore, router]);

  const resend = async () => { if (user) { try { await sendEmailVerification(user); setSent(true); } catch { /* ignore */ } } };

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

  const st = STATUS[partner.reviewStatus ?? 'pending'] ?? STATUS.pending;
  const verified = !!user?.emailVerified;

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
        <p className="text-sm text-slate-600">{partner.businessName ? partner.businessName : partner.partnerType === 'business' ? 'Business partner' : 'Individual partner'} · Ref {partner.ref}</p>

        {/* Email verification banner */}
        {!verified && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><MailCheck size={18} /> Please verify your email to activate your account.</div>
            <button onClick={resend} disabled={sent} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-60">{sent ? 'Email sent' : 'Resend verification'}</button>
          </div>
        )}

        {/* Status card */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${st.tone}`}><st.icon size={13} /> {st.label}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{st.note}</p>
          {partner.reviewStatus === 'approved' && !verified && (
            <p className="mt-2 text-xs font-semibold text-amber-700">Verify your email above to unlock referral features.</p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Need help? Email contact@smartlabs.lk</p>
      </div>
    </div>
  );
}
