'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Clock, CalendarDays } from 'lucide-react';
import { useUser } from '@/firebase';
import { getRecording, getMyAccess, isAccessValid, daysLeft, accessExpiryDate } from '@/lib/services/recordings.service';
import { type ClassRecording, type RecordingAccess, bunnyEmbedUrl, monthLabel } from '@/types/recording';

export default function RecordingPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isUserLoading } = useUser();

  const [rec, setRec] = useState<ClassRecording | null>(null);
  const [access, setAccess] = useState<RecordingAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    (async () => {
      setLoading(true);
      try {
        const r = await getRecording(id);
        setRec(r);
        if (user) {
          const all = await getMyAccess(user.uid);
          setAccess(all.find(a => a.recordingId === id) ?? null);
        }
      } catch (e) {
        console.error('[recording] load failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isUserLoading]);

  if (isUserLoading || loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!rec || rec.published === false) {
    return (
      <Shell>
        <div className="text-center py-20 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
          <p className="font-black text-slate-700">Recording not found</p>
          <p className="text-sm text-slate-400 mt-1">It may have been removed or is not published yet.</p>
        </div>
      </Shell>
    );
  }

  // Access is re-checked here — a shared URL alone never unlocks the video.
  if (!isAccessValid(access)) {
    const expired = !!access;
    return (
      <Shell>
        <div className="text-center py-16 rounded-3xl border border-slate-200 bg-white">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-black text-slate-800 text-lg">{expired ? 'Your access has expired' : 'You have not purchased this recording'}</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {expired
              ? 'Access lasts 30 days from purchase. Buy it again to keep watching.'
              : 'Purchase this class recording to watch it for 30 days.'}
          </p>
          <Link href="/dashboard/recordings" className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-sm">
            Go to Recordings
          </Link>
        </div>
      </Shell>
    );
  }

  const left = daysLeft(access!);
  const exp = accessExpiryDate(access!);

  return (
    <Shell>
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video">
        <iframe
          src={bunnyEmbedUrl(rec.bunnyLibraryId, rec.bunnyVideoId)}
          loading="lazy"
          className="w-full h-full"
          style={{ border: 0 }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          title={rec.title}
        />
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-primary">
          {monthLabel(rec.month)} · Class {rec.classNumber}
        </p>
        <h1 className="text-2xl font-black text-slate-900 mt-1">{rec.title}</h1>
        {rec.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{rec.description}</p>}

        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <CalendarDays size={14} /> Class held {rec.classDate}
          </span>
          <span className={`inline-flex items-center gap-1.5 ${left <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>
            <Clock size={14} /> {left} day{left === 1 ? '' : 's'} of access left
            {exp && <span className="text-slate-400 font-normal">(until {exp.toLocaleDateString()})</span>}
          </span>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard/recordings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> All Recordings
      </Link>
      {children}
    </div>
  );
}
