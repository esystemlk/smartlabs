'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { Coins, Infinity as InfinityIcon } from 'lucide-react';

/**
 * A small "credits remaining" pill for AI pages. Shows the usable balance for
 * the given pool (its own paid credits + the shared universal credits), or
 * "Unlimited" for staff / an active monthly plan. Always a link to /credits
 * (the new top-up page), and turns red when the balance is 0.
 */
export type CreditPool = 'essay' | 'swt' | 'sst' | 'speaking' | 'ielts';

const UNLIMITED_ROLES = ['admin', 'developer', 'teacher'];
const POOL: Record<CreditPool, { paid: string; monthly: string }> = {
  essay:    { paid: 'essayPaidCredits',      monthly: 'essayMonthlyExpiry' },
  swt:      { paid: 'swtPaidCredits',        monthly: 'swtMonthlyExpiry' },
  sst:      { paid: 'sstPaidCredits',        monthly: 'sstMonthlyExpiry' },
  speaking: { paid: 'speakingPaidCredits',   monthly: 'speakingMonthlyExpiry' },
  ielts:    { paid: 'ieltsEssayPaidCredits', monthly: 'ieltsEssayMonthlyExpiry' },
};

// Expiry may be a Firestore Timestamp/Date (PTE pools) or an epoch-ms number (IELTS).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function active(v: any): boolean {
  if (v == null) return false;
  let ms = 0;
  if (typeof v === 'number') ms = v;
  else if (typeof v?.toDate === 'function') ms = v.toDate().getTime();
  else if (v instanceof Date) ms = v.getTime();
  return ms > Date.now();
}

export function CreditsPill({ pool, className = '' }: { pool: CreditPool; className?: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [state, setState] = useState<{ unlimited: boolean; remaining: number } | null>(null);

  useEffect(() => {
    if (!user || !firestore) return;
    const f = POOL[pool];
    const unsub = onSnapshot(doc(firestore, 'users', user.uid), (snap) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = snap.data() ?? {};
      const unlimited = UNLIMITED_ROLES.includes(d.role ?? 'student') || active(d[f.monthly]) || active(d.universalMonthlyExpiry);
      const remaining = (Number(d[f.paid]) || 0) + (Number(d.universalPaidCredits) || 0);
      setState({ unlimited, remaining });
    }, () => setState(null));
    return () => unsub();
  }, [user, firestore, pool]);

  if (!user) return null;

  const zero = !!state && !state.unlimited && state.remaining === 0;
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition-opacity hover:opacity-90';
  const tone = zero ? 'border-red-200 bg-red-50 text-red-600' : 'border-orange-200 bg-orange-50 text-orange-600';

  return (
    <Link href="/credits" className={`${base} ${tone} ${className}`} title="Top up AI credits">
      {state?.unlimited ? <InfinityIcon size={13} /> : <Coins size={13} />}
      {state == null ? 'Credits' : state.unlimited ? 'Unlimited' : `${state.remaining} credit${state.remaining === 1 ? '' : 's'}`}
      {zero ? ' · Top up' : ''}
    </Link>
  );
}
