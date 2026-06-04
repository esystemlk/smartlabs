import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Daily mood stored on the user document:
 *   users/{uid}.mood = { value: string, date: 'YYYY-MM-DD', ts: number }
 *
 * Auto-expires after 2 days: when read past that window, it's cleared so it
 * no longer shows on the profile and the prompt fires again.
 */

export interface UserMood {
  value: string;
  date: string;
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const moodToday = () => new Date().toISOString().slice(0, 10);

export async function getUserMood(uid: string): Promise<UserMood | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (snap.data() as any)?.mood;
  if (!m || !m.value) return null;

  // Expire anything older than 2 days.
  const ts: number = typeof m.ts === 'number' ? m.ts : 0;
  if (!ts || Date.now() - ts > TWO_DAYS_MS) {
    try { await updateDoc(ref, { mood: null }); } catch { /* ignore */ }
    return null;
  }
  return { value: m.value as string, date: m.date as string };
}

export async function setUserMood(uid: string, value: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { mood: { value, date: moodToday(), ts: Date.now() } });
}

/** True if the user has already set today's mood (so don't prompt again). */
export function isMoodSetToday(mood: UserMood | null): boolean {
  return !!mood && mood.date === moodToday();
}
