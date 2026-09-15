import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';

export type SkillKey = 'speaking' | 'reading' | 'writing' | 'listening';
export const SKILL_ORDER: SkillKey[] = ['speaking', 'reading', 'writing', 'listening'];

/** One completed practice attempt, normalised to a 0–90 PTE-style score. */
export interface Attempt {
  skill: SkillKey;
  taskType: string;
  score: number; // 0–90
  at: number; // epoch ms
}

const KEY = (uid: string) => `sl.attempts.${uid}`;
const MAX = 800;

/** Friendly labels for task types (for weak-area lists). */
export const TASK_LABEL: Record<string, string> = {
  'read-aloud': 'Read Aloud',
  'repeat-sentence': 'Repeat Sentence',
  'describe-image': 'Describe Image',
  'retell-lecture': 'Retell Lecture',
  'answer-short-question': 'Short Question',
  'summarize-group-discussion': 'Summarize Discussion',
  'respond-to-situation': 'Respond to Situation',
  swt: 'Summarize Written Text',
  'write-essay': 'Write Essay',
  sst: 'Summarize Spoken Text',
  wfd: 'Write from Dictation',
  'fill-blanks': 'Reading Fill in Blanks',
  'rw-fill-blanks': 'R&W Fill in Blanks',
  'mcq-multiple': 'Multiple Choice (multi)',
  'reading-mcq-single': 'Multiple Choice (single)',
  'reorder-paragraphs': 'Reorder Paragraphs',
};
export const taskLabel = (t: string) => TASK_LABEL[t] ?? t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function loadAttempts(uid: string): Promise<Attempt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(uid));
    const list = raw ? (JSON.parse(raw) as Attempt[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Record a completed attempt. `value`/`max` are the trainer's natural score
 * (e.g. 7/9 for SWT, 78/90 for speaking); we normalise to 0–90.
 */
export async function recordAttempt(
  uid: string | undefined,
  skill: SkillKey,
  taskType: string,
  value: number,
  max: number,
): Promise<void> {
  if (!uid) return;
  const score = Math.max(0, Math.min(90, Math.round((value / (max || 1)) * 90)));
  try {
    const list = await loadAttempts(uid);
    list.push({ skill, taskType, score, at: Date.now() });
    await AsyncStorage.setItem(KEY(uid), JSON.stringify(list.slice(-MAX)));
  } catch {
    /* best effort */
  }
}

/* ── Pure analytics ─────────────────────────────────────────────────────── */

export type SkillScores = Record<SkillKey, number | null>;

export function skillAverages(attempts: Attempt[]): SkillScores {
  const out: SkillScores = { speaking: null, reading: null, writing: null, listening: null };
  for (const k of SKILL_ORDER) {
    const vals = attempts.filter((a) => a.skill === k).map((a) => a.score);
    if (vals.length) out[k] = Math.round(vals.reduce((x, y) => x + y, 0) / vals.length);
  }
  return out;
}

export function overallAverage(scores: SkillScores): number | null {
  const vals = SKILL_ORDER.map((k) => scores[k]).filter((v): v is number => v !== null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}
// Back-compat name used by existing screens.
export const currentAverage = overallAverage;

const DAY = 86400000;
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Average score per week for the last `weeks` weeks (null weeks = no practice). */
export function weeklyTrend(attempts: Attempt[], weeks = 8): { label: string; value: number | null }[] {
  const now = Date.now();
  const out: { label: string; value: number | null }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * 7 * DAY;
    const start = end - 7 * DAY;
    const vals = attempts.filter((a) => a.at > start && a.at <= end).map((a) => a.score);
    const d = new Date(end);
    out.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      value: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null,
    });
  }
  return out;
}

export interface WeakArea { taskType: string; skill: SkillKey; avg: number; count: number }
export function weakAreas(attempts: Attempt[], top = 3): WeakArea[] {
  const groups = new Map<string, { skill: SkillKey; scores: number[] }>();
  for (const a of attempts) {
    const g = groups.get(a.taskType) ?? { skill: a.skill, scores: [] };
    g.scores.push(a.score);
    groups.set(a.taskType, g);
  }
  return [...groups.entries()]
    .map(([taskType, g]) => ({ taskType, skill: g.skill, count: g.scores.length, avg: Math.round(g.scores.reduce((x, y) => x + y, 0) / g.scores.length) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, top);
}

/** Consecutive days (ending today or yesterday) with at least one attempt. */
export function streakOf(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  const days = new Set(attempts.map((a) => dayKey(a.at)));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to "hold" if they haven't practised yet today but did yesterday.
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todayCount(attempts: Attempt[]): number {
  const today = dayKey(Date.now());
  return attempts.filter((a) => dayKey(a.at) === today).length;
}

/* ── Hooks ──────────────────────────────────────────────────────────────── */

export interface Analytics {
  loading: boolean;
  attempts: Attempt[];
  skillScores: SkillScores;
  overall: number | null;
  trend: { label: string; value: number | null }[];
  weak: WeakArea[];
  streak: number;
  today: number;
  total: number;
}

/** Live analytics for the signed-in user; refreshes when the screen refocuses. */
export function useAnalytics(): Analytics {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!user) { setAttempts([]); setLoading(false); return; }
      loadAttempts(user.uid).then((a) => { if (alive) { setAttempts(a); setLoading(false); } });
      return () => { alive = false; };
    }, [user]),
  );

  const skillScores = skillAverages(attempts);
  return {
    loading,
    attempts,
    skillScores,
    overall: overallAverage(skillScores),
    trend: weeklyTrend(attempts),
    weak: weakAreas(attempts),
    streak: streakOf(attempts),
    today: todayCount(attempts),
    total: attempts.length,
  };
}

/** Back-compat hook for screens that only need per-skill averages. */
export function useSkillScores(): SkillScores {
  return useAnalytics().skillScores;
}
