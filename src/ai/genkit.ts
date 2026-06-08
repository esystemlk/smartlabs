import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { AiCallLog } from '@/lib/services/ai-usage.service';

const getApiKeys = (): string[] => {
  const keys = [
    process.env.GOOGLE_GENAI_API_KEY_1,
    process.env.GOOGLE_GENAI_API_KEY_2,
    process.env.GOOGLE_GENAI_API_KEY_3,
    process.env.GOOGLE_GENAI_API_KEY_4,
    process.env.GOOGLE_GENAI_API_KEY_5,
  ].filter(Boolean) as string[];

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

// One Genkit instance per API key, lazily created
const instances: Map<string, any> = new Map();

const getInstance = (apiKey: string) => {
  if (!instances.has(apiKey)) {
    instances.set(
      apiKey,
      genkit({
        plugins: [googleAI({ apiKey })],
        model: 'googleai/gemini-2.5-flash',
      })
    );
  }
  return instances.get(apiKey)!;
};

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
 * Returns a Genkit AI instance using round-robin key selection.
 */
export const getAi = () => {
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
  const keys = getApiKeys();
  const startIndex = counter % keys.length;
  counter = (counter + 1) % keys.length;

  const task  = meta?.task   ?? 'server-action';
  const ip    = meta?.ip     ?? null;
  const userId = meta?.userId ?? null;
  const email  = meta?.email  ?? null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIndex + attempt) % keys.length;
    const ai = getInstance(keys[keyIndex]);

    let lastError: any = null;
    for (let retry = 0; retry <= MAX_RETRIES_PER_KEY; retry++) {
      try {
        const result = await fn(ai);
        logKeyUsage(keyIndex + 1, true, false, null, task, ip, userId, email, 'gemini-2.5-flash');
        return result;
      } catch (error: any) {
        lastError = error;
        const rateLimit = isRateLimitError(error);

        if (rateLimit) {
          // Rate limit → skip to next key immediately, no retries
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

    if (rateLimit && attempt < keys.length - 1) {
      console.warn(`API key [${keyIndex + 1}] hit rate limit. Falling back to next key.`);
      logKeyUsage(keyIndex + 1, false, true, errMsg, task, ip, userId, email, 'gemini-2.5-flash');
      continue;
    }

    if (attempt < keys.length - 1) {
      console.warn(`API key [${keyIndex + 1}] failed after retries. Trying next key.`);
      logKeyUsage(keyIndex + 1, false, false, errMsg, task, ip, userId, email, 'gemini-2.5-flash');
      continue;
    }

    logKeyUsage(keyIndex + 1, false, rateLimit, errMsg, task, ip, userId, email, 'gemini-2.5-flash');
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
