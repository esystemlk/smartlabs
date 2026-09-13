import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/auth/AuthContext';
import type { CreditsState } from '@/credits/CreditsContext';

export type SkillKey = 'speaking' | 'reading' | 'writing' | 'listening';
export const SKILL_ORDER: SkillKey[] = ['speaking', 'reading', 'writing', 'listening'];

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
 * Per-skill rolling average scores, stored locally as the student practises.
 * Returns `null` for a skill with no attempts yet (shown as "—", never faked).
 */
const scoreKey = (uid: string) => `sl.skillScores.${uid}`;
export type SkillScores = Record<SkillKey, number | null>;
const EMPTY_SCORES: SkillScores = { speaking: null, reading: null, writing: null, listening: null };

export function useSkillScores(): SkillScores {
  const { user } = useAuth();
  const [scores, setScores] = useState<SkillScores>(EMPTY_SCORES);

  useEffect(() => {
    let alive = true;
    if (!user) return setScores(EMPTY_SCORES);
    AsyncStorage.getItem(scoreKey(user.uid))
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            setScores({ ...EMPTY_SCORES, ...JSON.parse(raw) });
          } catch {
            setScores(EMPTY_SCORES);
          }
        } else {
          setScores(EMPTY_SCORES);
        }
      })
      .catch(() => alive && setScores(EMPTY_SCORES));
    return () => {
      alive = false;
    };
  }, [user]);

  return scores;
}

/** Overall current average across skills that have data (null if none yet). */
export function currentAverage(scores: SkillScores): number | null {
  const vals = SKILL_ORDER.map((k) => scores[k]).filter((v): v is number => typeof v === 'number');
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * A single "AI Credits" figure for the unified-wallet UI: the sum of paid
 * credits across every pool. Staff roles show as unlimited via `credits.unlimited`.
 */
export function totalPaidCredits(credits: CreditsState): number {
  return credits.speaking.paid + credits.sst.paid + credits.swt.paid + credits.essay.paid;
}
