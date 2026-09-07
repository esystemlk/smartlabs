import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Lightweight local practice tracker — counts completed AI scorings so the
 * dashboard can show real progress (not a fabricated number). Per-device, and
 * per signed-in user via the key suffix.
 */
const KEY = (uid: string) => `sl.sessions.${uid}`;
export const WEEKLY_GOAL = 20;

export async function getSessions(uid: string): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY(uid));
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function bumpSession(uid: string | undefined): Promise<void> {
  if (!uid) return;
  try {
    const n = await getSessions(uid);
    await AsyncStorage.setItem(KEY(uid), String(n + 1));
  } catch {
    /* ignore */
  }
}
