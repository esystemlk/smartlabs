import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { AiCallLog } from '@/lib/services/ai-usage.service';
import { currentMockAiKey } from '@/lib/mock-ai-context';
import { getKeyMode, peekKeyMode } from '@/lib/ai-key-mode';
import { KEY6_MODELS } from '@/lib/gemini-fetch';

const getApiKeys = (): string[] => {
  // Admin "use only one key" switch (last known value; callWithFallback awaits a fresh read).
  const mode = peekKeyMode();
  if (mode.mode === 'single') return [mode.key];

  const keys = [
    process.env.GOOGLE_GENAI_API_KEY_1,
    process.env.GOOGLE_GENAI_API_KEY_2,
    process.env.GOOGLE_GENAI_API_KEY_3,
    process.env.GOOGLE_GENAI_API_KEY_4,
    process.env.GOOGLE_GENAI_API_KEY_5,
    process.env.GOOGLE_GENAI_API_KEY_6, // all 6 keys share the load in automatic mode
  ].filter(Boolean) as string[];

  // Full mocks prefer the dedicated key 6, then fall back to the rest of the pool so
  // a missing/exhausted key 6 never dead-ends mock scoring.
  const mockKey = currentMockAiKey();
  if (mockKey) return [mockKey, ...keys.filter(k => k !== mockKey)];

  if (keys.length === 0) {
    const legacy = process.env.GOOGLE_GENAI_API_KEY;
    if (legacy) return [legacy];
    if (typeof window === 'undefined') {
      console.warn('WARNING: No GOOGLE_GENAI_API_KEY_* keys defined. AI features will fail.');
    }
    return ['missing-api-key'];
  }

  return keys;
};

// One Genkit instance per API key + model, lazily created
const instances: Map<string, any> = new Map();
const DEFAULT_MODEL = 'gemini-flash-latest';

const getInstance = (apiKey: string, model: string = DEFAULT_MODEL) => {
  const id = `${model}|${apiKey}`;
  if (!instances.has(id)) {
    instances.set(
      id,
      genkit({
        plugins: [googleAI({ apiKey })],
        model: `googleai/${model}`,
      })
    );
  }
  return instances.get(id)!;
};

type Attempt = { key: string; slot: number; model: string };
const PAID_SLOT = 6;
const slotKey = (slot: number) => (process.env[`GOOGLE_GENAI_API_KEY_${slot}`] ?? '').trim();

/**
 * Ordered (key, model) attempts for one call:
 * - one-key mode: that key only (KEY_6 walks its approved model ladder);
 * - automatic: the paid KEY_6 first through its approved ladder, then the free keys 1–5
 *   (rotated) on the default model — so a failing model moves to the next MODEL on KEY_6
 *   before any other key is used.
 */
function attemptPlan(mode: Awaited<ReturnType<typeof getKeyMode>>): Attempt[] {
  const ladder = KEY6_MODELS.map(m => m.name);
  if (mode.mode === 'single') {
    return (mode.slot === PAID_SLOT ? ladder : [DEFAULT_MODEL]).map(model => ({ key: mode.key, slot: mode.slot, model }));
  }
  const paidKey = (currentMockAiKey() || slotKey(PAID_SLOT)).trim();
  const free = [1, 2, 3, 4, 5].map(slot => ({ slot, key: slotKey(slot) })).filter(k => k.key && k.key !== paidKey);
  const start = free.length > 1 ? counter++ % free.length : 0;
  const rotated = [...free.slice(start), ...free.slice(0, start)];
  const plan: Attempt[] = [
    ...(paidKey ? ladder.map(model => ({ key: paidKey, slot: PAID_SLOT, model })) : []),
    ...rotated.map(k => ({ key: k.key, slot: k.slot, model: DEFAULT_MODEL })),
  ];
  if (plan.length) return plan;
  const legacy = process.env.GOOGLE_GENAI_API_KEY;
  return [{ key: legacy || 'missing-api-key', slot: 0, model: DEFAULT_MODEL }];
}

// Round-robin counter (module-level, shared across requests in the same process)
let counter = 0;

export const isRateLimitError = (error: any): boolean => {
  const msg: string = (error?.message || error?.toString() || '').toLowerCase();
  const status = error?.status ?? error?.statusCode ?? error?.code;
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted')
  );
};

const isTransientError = (error: any): boolean => {
  if (isRateLimitError(error)) return false;
  const msg: string = (error?.message || error?.toString() || '').toLowerCase();
  const status = error?.status ?? error?.statusCode;
  return (
    status === 500 || status === 502 || status === 503 || status === 504 ||
    msg.includes('overload') || msg.includes('high demand') ||
    msg.includes('timeout') || msg.includes('internal') ||
    msg.includes('temporarily') || msg.includes('unavailable')
  );
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const MAX_RETRIES_PER_KEY = 2;

/** Fire-and-forget usage logger — never blocks the caller. */
async function logKeyUsage(
  keyIndex: number,
  success: boolean,
  isRateLimit: boolean,
  error: string | null,
  task: AiCallLog['task'] = 'server-action',
  ip: string | null = null,
  userId: string | null = null,
  email: string | null = null,
  model: string | null = 'gemini-2.5-flash',
) {
  try {
    const { logAiCall } = await import('@/lib/services/ai-usage.service');
    await logAiCall({
      userId,
      email,
      ip,
      task,
      keyLabel: `KEY_${keyIndex}`,
      keyIndex,
      model,
      success,
      isRateLimit,
      error,
      timestamp: new Date(),
    });
  } catch { /* non-fatal */ }
}

/**
 * Returns a Genkit AI instance (synchronous): the chosen key in one-key mode, else the paid
 * KEY_6, else round-robin over the free keys. Real calls go through callWithFallback.
 */
export const getAi = () => {
  const mode = peekKeyMode();
  if (mode.mode === 'single') return getInstance(mode.key);
  const paid = currentMockAiKey() || slotKey(PAID_SLOT);
  if (paid) return getInstance(paid);
  const keys = getApiKeys();
  const key = keys[counter % keys.length];
  counter = (counter + 1) % keys.length;
  return getInstance(key);
};

/**
 * Executes `fn` with round-robin key selection.
 * On a 429 / quota error, retries with each remaining key before throwing.
 * Logs every attempt to Firestore (fire-and-forget).
 */
export const callWithFallback = async <T>(
  fn: (ai: any) => Promise<T>,
  meta?: { task?: AiCallLog['task']; ip?: string | null; userId?: string | null; email?: string | null }
): Promise<T> => {
  // Admin "use only one key" switch, else KEY_6 (paid) first through its model ladder.
  const mode = await getKeyMode();
  const single = mode.mode === 'single';
  const plan = attemptPlan(mode);

  const task  = meta?.task   ?? 'server-action';
  const ip    = meta?.ip     ?? null;
  const userId = meta?.userId ?? null;
  const email  = meta?.email  ?? null;

  for (let attempt = 0; attempt < plan.length; attempt++) {
    const { key, slot, model } = plan[attempt];
    const keyIndex = slot - 1; // for the existing log lines (they print keyIndex + 1)
    const usageKeyIndex = slot;
    const ai = getInstance(key, model);

    let lastError: any = null;
    for (let retry = 0; retry <= MAX_RETRIES_PER_KEY; retry++) {
      try {
        const result = await fn(ai);
        logKeyUsage(usageKeyIndex, true, false, null, task, ip, userId, email, model);
        return result;
      } catch (error: any) {
        lastError = error;
        const rateLimit = isRateLimitError(error);

        if (rateLimit) {
          // One fixed key: no other key to try, so wait the rate limit out and retry (1.5s, 3s).
          if (single && retry < MAX_RETRIES_PER_KEY) {
            const delay = 1500 * (retry + 1);
            console.warn(`[genkit] KEY_${usageKeyIndex} rate-limited (single-key mode, retry ${retry + 1}/${MAX_RETRIES_PER_KEY}), waiting ${delay}ms…`);
            await sleep(delay);
            continue;
          }
          // Auto → skip to next key immediately, no retries
          break;
        }

        if (isTransientError(error) && retry < MAX_RETRIES_PER_KEY) {
          const delay = 1000 * (retry + 1); // 1s, 2s
          console.warn(`[genkit] Key [${keyIndex + 1}] transient error (retry ${retry + 1}/${MAX_RETRIES_PER_KEY}), waiting ${delay}ms…`);
          await sleep(delay);
          continue;
        }

        // Non-transient or retries exhausted → fall through to next key
        break;
      }
    }

    const errMsg = lastError?.message || String(lastError);
    const rateLimit = isRateLimitError(lastError);

    if (rateLimit && attempt < plan.length - 1) {
      console.warn(`[genkit] KEY_${slot} / ${model} hit a rate limit. Trying the next model/key.`);
      logKeyUsage(usageKeyIndex, false, true, errMsg, task, ip, userId, email, model);
      continue;
    }

    if (attempt < plan.length - 1) {
      console.warn(`[genkit] KEY_${slot} / ${model} failed after retries. Trying the next model/key.`);
      logKeyUsage(usageKeyIndex, false, false, errMsg, task, ip, userId, email, model);
      continue;
    }

    logKeyUsage(usageKeyIndex, false, rateLimit, errMsg, task, ip, userId, email, model);
    throw lastError;
  }

  throw new Error('All Gemini API keys exhausted or rate-limited.');
};

// Backward-compatible proxy — existing flows that call getAi() keep working
export const ai = new Proxy({} as any, {
  get: (_target, prop) => {
    return (getAi() as any)[prop];
  },
});
