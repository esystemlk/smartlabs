import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/auth/AuthContext';

/** One credit pool's live status, derived from the users/{uid} document. */
export interface PoolStatus {
  freeUsed: number;
  freeLimit: number;
  paid: number;
  monthlyActive: boolean;
  /** True when the user can score at least once more without paying. */
  canUse: boolean;
}

export interface CreditsState {
  loading: boolean;
  role: string;
  unlimited: boolean; // staff roles never spend credits
  /** Shared universal credits — usable on every AI part. */
  universalPaid: number;
  universalMonthly: boolean;
  sst: PoolStatus;
  swt: PoolStatus;
  speaking: PoolStatus;
  essay: PoolStatus;
}

const FREE_LIMITS = { sst: 2, swt: 2, speaking: 3, essay: 2 } as const;
type PoolKey = keyof typeof FREE_LIMITS;

const EMPTY: PoolStatus = { freeUsed: 0, freeLimit: 0, paid: 0, monthlyActive: false, canUse: false };

const CreditsContext = createContext<CreditsState | undefined>(undefined);

function toDate(v: unknown): Date | null {
  const ts = v as Timestamp | undefined;
  return ts?.toDate ? ts.toDate() : null;
}

function poolFrom(d: Record<string, unknown>, key: PoolKey, unlimited: boolean, universalUsable: boolean): PoolStatus {
  const freeLimit = FREE_LIMITS[key];
  const freeUsed = (d[`${key}FreeUsed`] as number) ?? 0;
  const paid = (d[`${key}PaidCredits`] as number) ?? 0;
  const expiry = toDate(d[`${key}MonthlyExpiry`]);
  const monthlyActive = !!(expiry && expiry > new Date());
  // Universal credits (paid or monthly) can also cover this pool.
  const canUse = unlimited || monthlyActive || paid > 0 || freeUsed < freeLimit || universalUsable;
  return { freeUsed, freeLimit, paid, monthlyActive, canUse };
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<CreditsState>({
    loading: true,
    role: 'student',
    unlimited: false,
    universalPaid: 0,
    universalMonthly: false,
    sst: EMPTY,
    swt: EMPTY,
    speaking: EMPTY,
    essay: EMPTY,
  });

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const d = (snap.data() ?? {}) as Record<string, unknown>;
        const role = (d.role as string) ?? 'student';
        const unlimited = ['admin', 'developer', 'teacher'].includes(role);
        const universalPaid = (d.universalPaidCredits as number) ?? 0;
        const uniExpiry = toDate(d.universalMonthlyExpiry);
        const universalMonthly = !!(uniExpiry && uniExpiry > new Date());
        const universalUsable = universalPaid > 0 || universalMonthly;
        setState({
          loading: false,
          role,
          unlimited,
          universalPaid,
          universalMonthly,
          sst: poolFrom(d, 'sst', unlimited, universalUsable),
          swt: poolFrom(d, 'swt', unlimited, universalUsable),
          speaking: poolFrom(d, 'speaking', unlimited, universalUsable),
          essay: poolFrom(d, 'essay', unlimited, universalUsable),
        });
      },
      () => setState((s) => ({ ...s, loading: false })),
    );
    return unsub;
  }, [user]);

  return <CreditsContext.Provider value={state}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsState {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used within a CreditsProvider');
  return ctx;
}
