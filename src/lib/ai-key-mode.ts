// Admin switch for which Gemini key the AI uses (server only).
//
// 'auto'   = today's behaviour: rotate through GOOGLE_GENAI_API_KEY_1..5 (mocks prefer KEY_6) and fail
//            over to the next key on errors.
// 'single' = every AI call (exams, mocks, practice scorers, chat) uses ONLY the chosen key slot. No
//            switching to other keys; busy/rate-limit errors are waited out and retried on that key.
//
// Stored in Firestore system_config/ai_key_mode as the slot NUMBER only — never the key itself.
// If the chosen slot has no key on the server, or the setting cannot be read, we fall back to 'auto'
// so students are never blocked by a setting.

export type KeyMode = { mode: 'auto' } | { mode: 'single'; slot: number; key: string };

export const KEY_SLOTS = [1, 2, 3, 4, 5, 6] as const;
const TTL_MS = 15_000;
const AUTO: KeyMode = { mode: 'auto' };

let cached: KeyMode = AUTO;
let fetchedAt = 0;
let inflight: Promise<KeyMode> | null = null;

/** Env value for a key slot, tolerant of stray quotes/spaces. */
export function keyForSlot(slot: number): string {
  return (process.env[`GOOGLE_GENAI_API_KEY_${slot}`] ?? '').trim().replace(/^["']|["']$/g, '');
}

async function load(): Promise<KeyMode> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin'); // lazy: keeps this module safe to import anywhere
    if (!adminDb) return cached;
    const d = (await adminDb.collection('system_config').doc('ai_key_mode').get()).data();
    const slot = Number(d?.slot);
    if (d?.mode === 'single' && KEY_SLOTS.includes(slot as (typeof KEY_SLOTS)[number])) {
      const key = keyForSlot(slot);
      if (key) return { mode: 'single', slot, key };
      console.warn(`[ai-key-mode] KEY_${slot} is selected but not set on the server; using automatic rotation.`);
    }
    return AUTO;
  } catch (e) {
    console.warn('[ai-key-mode] could not read the setting; keeping the last known mode.', e);
    return cached;
  }
}

/** Current mode, re-read from Firestore at most every 15 seconds. */
export async function getKeyMode(): Promise<KeyMode> {
  if (Date.now() - fetchedAt < TTL_MS) return cached;
  inflight ??= load().then(m => { cached = m; fetchedAt = Date.now(); return m; }).finally(() => { inflight = null; });
  return inflight;
}

/** Last known mode without waiting (for synchronous callers); refreshes in the background. */
export function peekKeyMode(): KeyMode {
  if (Date.now() - fetchedAt >= TTL_MS) void getKeyMode();
  return cached;
}

/** Make this server instance pick up a change immediately (used right after the admin saves). */
export function invalidateKeyMode() { fetchedAt = 0; }

/** Set this instance's mode directly (the admin route after saving; also the self-check). */
export function primeKeyMode(mode: 'auto' | 'single', slot?: number) {
  const key = mode === 'single' && slot ? keyForSlot(slot) : '';
  cached = key ? { mode: 'single', slot: slot!, key } : AUTO;
  fetchedAt = Date.now();
}
