'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import { getPackage, listClasses, getMyEnrollments } from '@/lib/services/recorded-packages.service';
import {
  type RecordedPackage, type RecordedClass, type RecordedEnrollment,
  formatLkr, isEnrollmentValid, daysLeft, bunnyEmbedUrl, packageTiers, tierLabel,
} from '@/types/recorded-package';
import {
  ArrowLeft, Loader2, Lock, PlayCircle, Clock, Film,
  AlertTriangle, ShieldCheck, ListVideo, GraduationCap, Landmark, MessageCircle, Phone,
} from 'lucide-react';

const WHATSAPP_NUMBER = '94774533233';
const PHONE_NUMBER = '+94774533233';

export default function RecordedPackagePlayer() {
  const { packageId } = useParams<{ packageId: string }>();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [pkg, setPkg] = useState<RecordedPackage | null>(null);
  const [classes, setClasses] = useState<RecordedClass[]>([]);
  const [enrollment, setEnrollment] = useState<RecordedEnrollment | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [agreed, setAgreed] = useState(false);
  const [buying, setBuying] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isUserLoading || !packageId) return;
    (async () => {
      setLoading(true);
      try {
        const [p, cls, enr] = await Promise.all([
          getPackage(packageId),
          listClasses(packageId, true),
          user ? getMyEnrollments(user.uid) : Promise.resolve([] as RecordedEnrollment[]),
        ]);
        setPkg(p);
        setClasses(cls);
        setEnrollment(enr.find(e => e.packageId === packageId) ?? null);
        setActiveId(cls[0]?.id ?? null);
      } catch (e) {
        console.error('[recorded-player] load failed:', e);
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [packageId, user, isUserLoading]);

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);
  useEffect(() => { if (pkg && selectedMonths == null) { const t = packageTiers(pkg); if (t.length) setSelectedMonths(t[0].months); } }, [pkg, selectedMonths]);

  const owned = isEnrollmentValid(enrollment);
  const active = classes.find(c => c.id === activeId) ?? null;

  const buy = async () => {
    if (!pkg) return;
    if (!user) { router.push(`/login?redirect=/dashboard/recorded-sessions/${packageId}`); return; }
    if (!agreed) { toast({ variant: 'destructive', title: 'Please accept the non-refundable notice.' }); return; }
    setBuying(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/recorded-packages/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId, months: selectedMonths ?? undefined }),
      });
      const d = await res.json();
      if (!res.ok || !d.params) { toast({ variant: 'destructive', title: d.error || 'Could not start payment.' }); return; }
      setPayhereParams(d.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally { setBuying(false); }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!pkg) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">This package could not be found.</p>
        <Link href="/dashboard/recorded-sessions" className="mt-3 inline-block text-primary underline text-sm">Back to Recorded Sessions</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <Link href="/dashboard/recorded-sessions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Recorded Sessions
      </Link>

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-tight">{pkg.title}</h1>
          {pkg.periodLabel && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{pkg.periodLabel}</span>}
        </div>
        {pkg.description && <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>}
      </div>

      {!owned ? (
        // ── Locked / purchase ──
        (() => {
          const tiers = packageTiers(pkg);
          const chosen = tiers.find(t => t.months === selectedMonths) ?? tiers[0];
          const waText = encodeURIComponent(`Hi SmartLabs, I'd like to buy the "${pkg.title}" recorded package (${chosen ? tierLabel(chosen.months) + ' — ' + formatLkr(chosen.price) : ''}) via bank transfer.`);
          return (
        <div className="mx-auto max-w-xl rounded-2xl border bg-card p-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">{enrollment ? 'Your access has expired' : 'Unlock this package'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {classes.length} recorded class{classes.length === 1 ? '' : 'es'}
              {pkg.includesGrammar && <> · <span className="inline-flex items-center gap-1 font-semibold text-primary"><GraduationCap className="h-3.5 w-3.5" /> Grammar included</span></>}
            </p>
          </div>

          {/* Duration tiers */}
          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            {tiers.map(t => {
              const sel = t.months === selectedMonths;
              return (
                <button key={t.months} onClick={() => setSelectedMonths(t.months)}
                  className={`rounded-xl border-2 p-3 text-center transition ${sel ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tierLabel(t.months)}</div>
                  <div className="mt-1 text-lg font-black">{formatLkr(t.price)}</div>
                  <div className="text-[11px] text-muted-foreground">access</div>
                </button>
              );
            })}
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-3.5 text-left cursor-pointer dark:border-red-800 dark:bg-red-950/30">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
            <span className="text-sm text-red-700 dark:text-red-300">
              <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> Non-refundable payment</span>
              I understand this payment is <b>strictly non-refundable under any circumstances</b> once paid, and access is removed automatically after the period ends.
            </span>
          </label>

          <button onClick={buy} disabled={buying}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {buying ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…</> : <><ShieldCheck className="h-4 w-4" /> Pay {chosen ? formatLkr(chosen.price) : ''} via PayHere</>}
          </button>

          {/* Bank transfer */}
          <div className="mt-5 rounded-xl border bg-muted/40 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold"><Landmark className="h-4 w-4" /> Paying by bank transfer?</p>
            <p className="mt-1 text-xs text-muted-foreground">Contact the SmartLabs admins to purchase by bank transfer. We&apos;ll grant your access manually once confirmed.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`tel:${PHONE_NUMBER}`}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold hover:bg-accent">
                <Phone className="h-4 w-4" /> Call {PHONE_NUMBER}
              </a>
            </div>
          </div>
        </div>
          );
        })()
      ) : (
        // ── Player ──
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border bg-black aspect-video">
              {active ? (
                <iframe
                  key={active.id}
                  src={bunnyEmbedUrl(active.bunnyLibraryId, active.bunnyVideoId)}
                  loading="lazy"
                  className="h-full w-full"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/60"><Film className="h-10 w-10" /></div>
              )}
            </div>
            {active && <h2 className="mt-3 text-base font-bold">{active.title}</h2>}
            <p className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {daysLeft(enrollment!)} day{daysLeft(enrollment!) === 1 ? '' : 's'} of access left
            </p>
          </div>

          {/* Playlist */}
          <div className="rounded-2xl border bg-card overflow-hidden lg:max-h-[70vh] lg:overflow-y-auto">
            <div className="sticky top-0 flex items-center gap-2 border-b bg-muted/40 px-4 py-3 text-sm font-semibold">
              <ListVideo className="h-4 w-4 text-primary" /> {classes.length} Classes
            </div>
            <div className="divide-y">
              {classes.map((c, i) => {
                const isActive = c.id === activeId;
                return (
                  <button key={c.id} onClick={() => setActiveId(c.id!)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {isActive ? <PlayCircle className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>{c.title}</p>
                      {c.duration && <p className="text-xs text-muted-foreground">{c.duration}</p>}
                    </div>
                  </button>
                );
              })}
              {classes.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No classes in this package yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
