'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';

function Unsubscribe() {
  const params = useSearchParams();
  const uid = params.get('uid') ?? '';
  const sig = params.get('sig') ?? '';
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!uid || !sig) { setState('error'); setMessage('This unsubscribe link is incomplete.'); return; }
    (async () => {
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, sig }),
        });
        const data = await res.json();
        if (!res.ok) { setState('error'); setMessage(data.error || 'Could not unsubscribe.'); return; }
        setState('done');
      } catch { setState('error'); setMessage('Network error. Please try again.'); }
    })();
  }, [uid, sig]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {state === 'loading' ? <Loader2 className="h-7 w-7 animate-spin" /> : state === 'done' ? <CheckCircle2 className="h-7 w-7 text-emerald-600" /> : <XCircle className="h-7 w-7 text-red-600" />}
      </div>
      {state === 'loading' && <p className="text-sm text-slate-500">Updating your email preferences…</p>}
      {state === 'done' && (
        <>
          <h1 className="text-xl font-black text-slate-900">You&rsquo;ve been unsubscribed</h1>
          <p className="mt-2 text-sm text-slate-500">You won&rsquo;t receive marketing or welcome-back emails from Smart Labs anymore. Important account emails may still be sent.</p>
          <p className="mt-1 text-sm text-slate-500">Changed your mind? Email <b>info@smartlabs.lk</b> to opt back in.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-xl font-black text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
          <p className="mt-1 text-sm text-slate-500">Need help? Call <b>070 691 4652</b> or email <b>info@smartlabs.lk</b>.</p>
        </>
      )}
      <Link href="/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><Mail size={15} /> Back to Smart Labs</Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>}><Unsubscribe /></Suspense>;
}
