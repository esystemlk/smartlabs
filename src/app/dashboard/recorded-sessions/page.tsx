'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import { listPackages, listClasses, getMyEnrollments } from '@/lib/services/recorded-packages.service';
import {
  type RecordedPackage, type RecordedEnrollment,
  formatLkr, isEnrollmentValid, daysLeft, bunnyThumbnailUrl,
} from '@/types/recorded-package';
import {
  PlayCircle, Loader2, Clock, Film, CheckCircle2, AlertTriangle, ShieldCheck, X, Lock,
} from 'lucide-react';

function RecordedSessionsInner() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [packages, setPackages] = useState<RecordedPackage[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [firstThumb, setFirstThumb] = useState<Record<string, string>>({});
  const [enrollments, setEnrollments] = useState<RecordedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState<RecordedPackage | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pkgs, enr] = await Promise.all([
        listPackages(true),
        user ? getMyEnrollments(user.uid) : Promise.resolve([] as RecordedEnrollment[]),
      ]);
      setPackages(pkgs);
      setEnrollments(enr);
      // class counts + cover thumbnails (parallel, small N)
      const counts: Record<string, number> = {};
      const thumbs: Record<string, string> = {};
      await Promise.all(pkgs.map(async p => {
        if (!p.id) return;
        const cls = await listClasses(p.id, true);
        counts[p.id] = cls.length;
        if (p.thumbnail) thumbs[p.id] = p.thumbnail;
        else if (cls[0]) thumbs[p.id] = bunnyThumbnailUrl(cls[0].bunnyLibraryId, cls[0].bunnyVideoId);
      }));
      setClassCounts(counts);
      setFirstThumb(thumbs);
    } catch (e) {
      console.error('[recorded-sessions] load failed:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (!isUserLoading) load(); /* eslint-disable-next-line */ }, [user, isUserLoading]);

  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') { toast({ title: 'Payment successful! 🎬', description: 'Your recorded sessions are unlocked. Check your email for the receipt.' }); load(); }
    else if (p === 'cancelled') { toast({ title: 'Payment cancelled', variant: 'destructive' }); }
    // eslint-disable-next-line
  }, [searchParams]);

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const enrollFor = useMemo(() => {
    const m = new Map<string, RecordedEnrollment>();
    enrollments.forEach(e => m.set(e.packageId, e));
    return m;
  }, [enrollments]);

  const buy = async () => {
    if (!confirm) return;
    if (!user) { router.push('/login?redirect=/dashboard/recorded-sessions'); return; }
    if (!agreed) { toast({ variant: 'destructive', title: 'Please accept the non-refundable notice.' }); return; }
    setBuying(confirm.id!);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/recorded-packages/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: confirm.id }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) { toast({ variant: 'destructive', title: d.error || 'Could not start payment.' }); return; }
      setPayhereParams(d.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally { setBuying(null); }
  };

  return (
    <div className="w-full">
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Film className="h-6 w-6 md:h-7 md:w-7 text-primary" /> Recorded Sessions
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
          Recordings of our real classes, released as monthly packages. Buy a package to watch every session in it — anytime, on any device.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading packages…
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No recorded packages are available yet. Please check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {packages.map(pkg => {
            const enr = enrollFor.get(pkg.id!);
            const owned = isEnrollmentValid(enr);
            const count = classCounts[pkg.id!] ?? 0;
            const thumb = firstThumb[pkg.id!];
            return (
              <div key={pkg.id} className="flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
                {/* Cover */}
                <div className="relative aspect-video bg-muted">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={pkg.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><Film className="h-10 w-10 text-muted-foreground/40" /></div>
                  )}
                  {pkg.periodLabel && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{pkg.periodLabel}</span>
                  )}
                  {owned && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-bold text-white">
                      <CheckCircle2 className="h-3 w-3" /> Owned
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold leading-snug">{pkg.title}</h3>
                  {pkg.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>}

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {count} class{count === 1 ? '' : 'es'}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pkg.accessMonths} month{pkg.accessMonths === 1 ? '' : 's'} access</span>
                  </div>

                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex gap-2 text-xs"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span>{f}</span></li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex-1" />

                  {owned ? (
                    <div className="space-y-2">
                      <p className="text-xs text-green-600 font-medium">{daysLeft(enr!)} day{daysLeft(enr!) === 1 ? '' : 's'} of access left</p>
                      <Link href={`/dashboard/recorded-sessions/${pkg.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        <PlayCircle className="h-4 w-4" /> Watch Now
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-extrabold">{formatLkr(pkg.price)}</span>
                      <button onClick={() => { setConfirm(pkg); setAgreed(false); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        <Lock className="h-3.5 w-3.5" /> Unlock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setConfirm(null)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-5 sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold">Unlock {confirm.title}</h2>
              <button onClick={() => setConfirm(null)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 mb-4">
              <span className="text-sm text-muted-foreground">{classCounts[confirm.id!] ?? 0} classes · {confirm.accessMonths} month{confirm.accessMonths === 1 ? '' : 's'} access</span>
              <span className="text-lg font-extrabold">{formatLkr(confirm.price)}</span>
            </div>

            <label className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-3.5 cursor-pointer dark:border-red-800 dark:bg-red-950/30 mb-4">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">
                <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> Non-refundable payment</span>
                I understand this payment is <b>strictly non-refundable under any circumstances</b> once paid.
              </span>
            </label>

            <button onClick={buy} disabled={!!buying}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {buying ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…</> : <><ShieldCheck className="h-4 w-4" /> Pay {formatLkr(confirm.price)} via PayHere</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordedSessionsPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <RecordedSessionsInner />
    </Suspense>
  );
}
