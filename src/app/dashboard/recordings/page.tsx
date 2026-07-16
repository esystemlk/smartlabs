'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, PlayCircle, Lock, Loader2, CreditCard, CalendarDays,
  Clock, X, ShieldCheck,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { payhereUrls } from '@/lib/payhere';
import {
  listRecordings, catalogWindow, getMyAccess, isAccessValid, daysLeft,
} from '@/lib/services/recordings.service';
import {
  type ClassRecording, type RecordingAccess,
  priceBreakdown, bunnyThumbnailUrl, monthLabel,
} from '@/types/recording';

function RecordingsInner() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [access, setAccess] = useState<RecordingAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ClassRecording | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [recs, acc] = await Promise.all([
        listRecordings(true),
        user ? getMyAccess(user.uid) : Promise.resolve([] as RecordingAccess[]),
      ]);
      setRecordings(recs);
      setAccess(acc);
    } catch (e) {
      console.error('[recordings] load failed:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (!isUserLoading) load(); /* eslint-disable-next-line */ }, [user, isUserLoading]);

  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') {
      toast({ title: 'Payment successful!', description: 'Your recording is unlocked for 30 days.' });
      load();
    } else if (p === 'cancelled') {
      toast({ title: 'Payment cancelled', variant: 'destructive' });
    }
    // eslint-disable-next-line
  }, [searchParams]);

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const accessFor = useMemo(() => {
    const map = new Map<string, RecordingAccess>();
    access.forEach(a => map.set(a.recordingId, a));
    return map;
  }, [access]);

  const owned = recordings.filter(r => isAccessValid(accessFor.get(r.id!)));
  const catalog = catalogWindow(recordings).filter(r => !isAccessValid(accessFor.get(r.id!)));

  const handleBuy = async (rec: ClassRecording) => {
    if (!user) return;
    setBuying(rec.id!);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/recordings/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recordingId: rec.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.params) {
        toast({ variant: 'destructive', title: data.error || 'Could not start payment' });
        return;
      }
      setPayhereParams(data.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally {
      setBuying(null);
      setConfirm(null);
    }
  };

  if (isUserLoading || loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <PlayCircle className="h-7 w-7 text-primary" /> Class Recordings
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Buy any recent class recording and watch it for 30 days. New recordings go up about two weeks after each live class.
        </p>
      </div>

      {owned.length > 0 && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">My Recordings</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {owned.map(rec => {
              const a = accessFor.get(rec.id!)!;
              const left = daysLeft(a);
              return (
                <Link
                  key={rec.id}
                  href={`/dashboard/recordings/${rec.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Thumb rec={rec} overlay={<PlayCircle className="h-12 w-12 text-white drop-shadow" />} />
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {monthLabel(rec.month)} · Class {rec.classNumber}
                    </p>
                    <h3 className="font-black text-slate-900 mt-1 line-clamp-2 group-hover:text-primary transition-colors">{rec.title}</h3>
                    <p className={`text-xs font-bold mt-2 inline-flex items-center gap-1 ${left <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                      <Clock size={13} /> {left} day{left === 1 ? '' : 's'} left
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3">Available to Purchase</h2>
        {catalog.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
            <p className="text-slate-600 font-bold">
              {recordings.length === 0 ? 'No recordings published yet.' : 'You already own every available recording.'}
            </p>
            <p className="text-slate-400 text-sm mt-1">New class recordings are added about two weeks after each live class.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map(rec => {
              const { total } = priceBreakdown(rec.price);
              const expired = accessFor.get(rec.id!);
              return (
                <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                  <Thumb rec={rec} overlay={<Lock className="h-8 w-8 text-white/90" />} dim />
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {monthLabel(rec.month)} · Class {rec.classNumber}
                    </p>
                    <h3 className="font-black text-slate-900 mt-1 line-clamp-2">{rec.title}</h3>
                    {rec.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{rec.description}</p>}
                    <p className="text-[11px] text-slate-400 mt-2 inline-flex items-center gap-1">
                      <CalendarDays size={12} /> Class held {rec.classDate}
                      {rec.duration ? ` · ${rec.duration}` : ''}
                    </p>
                    {expired && (
                      <p className="text-[11px] font-bold text-amber-600 mt-2">Your previous access expired — purchase again to rewatch.</p>
                    )}
                    <div className="mt-auto pt-4">
                      <button
                        onClick={() => setConfirm(rec)}
                        disabled={!!buying}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-sm py-2.5 disabled:opacity-50"
                      >
                        <CreditCard size={15} /> Buy — LKR {total.toLocaleString()}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-1.5">30 days access · incl. 2.99% processing fee</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-black text-slate-900">Confirm Purchase</h2>
              <button onClick={() => setConfirm(null)} aria-label="Close" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                <X size={15} />
              </button>
            </div>
            <p className="text-sm font-bold text-slate-800">{confirm.title}</p>
            <p className="text-xs text-slate-500 mb-4">{monthLabel(confirm.month)} · Class {confirm.classNumber}</p>

            {(() => {
              const { base, fee, total } = priceBreakdown(confirm.price);
              return (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
                  <Row label="Recording price" value={`LKR ${base.toLocaleString()}`} />
                  <Row label="Payment processing fee (2.99%)" value={`LKR ${fee.toLocaleString()}`} muted />
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-black text-slate-900">Total</span>
                    <span className="font-black text-primary">LKR {total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-slate-500 mt-3 inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> 30 days access, unlocked automatically after payment.
            </p>

            <button
              onClick={() => handleBuy(confirm)}
              disabled={!!buying}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-extrabold py-3 disabled:opacity-50"
            >
              {buying ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />} Pay with PayHere
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-2">🔒 Secured by PayHere · LKR</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? 'text-slate-500' : 'text-slate-700'}>{label}</span>
      <span className={muted ? 'text-slate-500' : 'text-slate-800 font-semibold'}>{value}</span>
    </div>
  );
}

function Thumb({ rec, overlay, dim }: { rec: ClassRecording; overlay?: React.ReactNode; dim?: boolean }) {
  const [err, setErr] = useState(false);
  const src = bunnyThumbnailUrl(rec.bunnyLibraryId, rec.bunnyVideoId);
  return (
    <div className="relative aspect-video bg-slate-900">
      {!err ? (
        <Image
          src={src}
          alt={rec.title}
          fill
          unoptimized
          className={`object-cover ${dim ? 'opacity-50' : 'opacity-90'}`}
          onError={() => setErr(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <PlayCircle className="h-10 w-10 text-white/30" />
        </div>
      )}
      {overlay && <div className="absolute inset-0 flex items-center justify-center">{overlay}</div>}
    </div>
  );
}

export default function RecordingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <RecordingsInner />
    </Suspense>
  );
}
