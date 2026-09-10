'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { listPackages, listClasses, getMyEnrollments } from '@/lib/services/recorded-packages.service';
import {
  type RecordedPackage, type RecordedEnrollment,
  formatLkr, isEnrollmentValid, daysLeft, bunnyThumbnailUrl, packageTiers,
} from '@/types/recorded-package';
import {
  PlayCircle, Loader2, Film, CheckCircle2, GraduationCap, ArrowRight,
} from 'lucide-react';

function RecordedSessionsInner() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [packages, setPackages] = useState<RecordedPackage[]>([]);
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [firstThumb, setFirstThumb] = useState<Record<string, string>>({});
  const [enrollments, setEnrollments] = useState<RecordedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (p === 'success') {
      toast({ title: 'Payment successful! 🎬', description: 'Activating your access — this can take a few seconds.' });
      // The PayHere webhook grants access server-side; it can land a moment after
      // this redirect. Re-fetch a few times so the newly-unlocked package shows
      // up without the student having to refresh manually.
      const delays = [1500, 4000, 8000, 15000, 25000];
      const timers = delays.map((ms) => setTimeout(() => { load(); }, ms));
      return () => timers.forEach(clearTimeout);
    }
    if (p === 'cancelled') { toast({ title: 'Payment cancelled', description: 'No charge was made. You can try again anytime.', variant: 'destructive' }); }
    // eslint-disable-next-line
  }, [searchParams]);

  const enrollFor = useMemo(() => {
    const m = new Map<string, RecordedEnrollment>();
    enrollments.forEach(e => m.set(e.packageId, e));
    return m;
  }, [enrollments]);

  return (
    <div className="w-full">
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

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> {count} class{count === 1 ? '' : 'es'}</span>
                    {pkg.includesGrammar && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        <GraduationCap className="h-3.5 w-3.5" /> Grammar included
                      </span>
                    )}
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
                      <div className="leading-tight">
                        <span className="block text-[11px] text-muted-foreground">from</span>
                        <span className="text-lg font-extrabold">{formatLkr(Math.min(...packageTiers(pkg).map(t => t.price)))}</span>
                      </div>
                      <Link href={`/dashboard/recorded-sessions/${pkg.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        View &amp; buy <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
