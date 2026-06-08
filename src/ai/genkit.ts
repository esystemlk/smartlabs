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
    try {
      const result = await fn(ai);
      // Log successful call (fire-and-forget)
      logKeyUsage(keyIndex + 1, true, false, null, task, ip, userId, email);
      return result;
    } catch (error: any) {
      const rateLimit = isRateLimitError(error);
      const errMsg = error?.message || String(error);

      if (rateLimit && attempt < keys.length - 1) {
        console.warn(`API key [${keyIndex + 1}] hit rate limit. Falling back to next key.`);
        logKeyUsage(keyIndex + 1, false, true, errMsg, task, ip, userId, email);
        continue;
      }

      // Final failure
      logKeyUsage(keyIndex + 1, false, rateLimit, errMsg, task, ip, userId, email);
      throw error;
    }
  }

  throw new Error('All Gemini API keys exhausted or rate-limited.');
};

// Backward-compatible proxy — existing flows that call getAi() keep working
export const ai = new Proxy({} as any, {
  get: (_target, prop) => {
    return (getAi() as any)[prop];
  },
});
