import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/auth/AuthContext';
import type { CreditsState } from '@/credits/CreditsContext';

// Skill scores + averages now derive from real recorded attempts. Re-exported
// here so existing screens keep importing them from '@/lib/meta'.
export type { SkillKey, SkillScores } from '@/lib/attempts';
export { SKILL_ORDER, useSkillScores, currentAverage } from '@/lib/attempts';

/** Default PTE goal shown until the student sets their own. */
export const DEFAULT_TARGET = 79;

export interface ProfileMeta {
  loading: boolean;
  /** Target overall PTE score (from users/{uid}.targetScore, else default). */
  targetScore: number;
  /** Exam date as a JS Date, or null if not set. */
  examDate: Date | null;
}

/** Live PTE target + exam date from the shared user document. */
export function useProfileMeta(): ProfileMeta {
  const { user } = useAuth();
  const [meta, setMeta] = useState<ProfileMeta>({ loading: true, targetScore: DEFAULT_TARGET, examDate: null });

  useEffect(() => {
    if (!user) {
      setMeta({ loading: false, targetScore: DEFAULT_TARGET, examDate: null });
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const d = (snap.data() ?? {}) as Record<string, unknown>;
        const target = typeof d.targetScore === 'number' ? d.targetScore : DEFAULT_TARGET;
        let examDate: Date | null = null;
        const ex = d.examDate as { toDate?: () => Date } | string | undefined;
        if (ex && typeof ex === 'object' && ex.toDate) examDate = ex.toDate();
        else if (typeof ex === 'string' && ex) {
          const parsed = new Date(ex);
          if (!Number.isNaN(parsed.getTime())) examDate = parsed;
        }
        setMeta({ loading: false, targetScore: target, examDate });
      },
      () => setMeta((m) => ({ ...m, loading: false })),
    );
    return unsub;
  }, [user]);

  return meta;
}

/**
 * A single "AI Credits" figure for the unified-wallet UI: the sum of paid
 * credits across every pool. Staff roles show as unlimited via `credits.unlimited`.
 */
export function totalPaidCredits(credits: CreditsState): number {
  return credits.speaking.paid + credits.sst.paid + credits.swt.paid + credits.essay.paid;
}
