// Shared Gemini REST caller with multi-KEY + multi-MODEL failover and a time
// budget. The fetch-based scorers used to pick ONE key and only retry that key,
// so a single bad/rate-limited key dead-ended the student. This tries other
// keys automatically (preferring the ones most likely to work) and only gives
// up after the deadline — at which point the caller shows a soft "try again".
import { currentMockAiKey } from '@/lib/mock-ai-context';
import { getKeyMode } from '@/lib/ai-key-mode';

// gemini-flash-latest first: a stable alias that resolves to each project's
// current Flash, so newer keys (where 2.5-flash is retired) and older keys both
// work. The pinned models stay as fallbacks for projects that still expose them.
export const GENAI_MODELS = [
  { name: 'gemini-flash-latest', api: 'v1beta' },
  { name: 'gemini-2.5-flash',    api: 'v1beta' },
  { name: 'gemini-2.5-pro',      api: 'v1beta' },
  { name: 'gemini-2.0-flash',    api: 'v1beta' },
] as const;

// KEY_6 is the paid key with credit. Owner-approved model ladder (14 Nov 2026), benchmarked on
// the real PTE essay rubric: these five gave the IDENTICAL score and criteria, so moving to the
// next one on a failure never changes a student's score. Do not add models without approval.
export const KEY6_MODELS = [
  { name: 'gemini-flash-latest',    api: 'v1beta' },
  { name: 'gemini-pro-latest',      api: 'v1beta' },
  { name: 'gemini-3.1-pro-preview', api: 'v1beta' },
  { name: 'gemini-3.7-flash',       api: 'v1beta' },
  { name: 'gemini-3.8-flash',       api: 'v1beta' },
] as const;
const PAID_KEY = 6;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const isRateLimit = (status: number, msg: string) =>
  status === 429 || /quota|rate limit|resource_exhausted/i.test(msg);
const isTransient = (status: number, msg: string) =>
  status === 500 || status === 502 || status === 503 || status === 504 ||
  /overload|high demand|timeout|internal|unavailable|temporar/i.test(msg);

// Preferred key order across all 6 keys. Defaults to 1,4,2,3,5,6 (the keys currently most reliable first);
// override with GENAI_KEY_PRIORITY="1,4,2,3,5,6" without a redeploy of this file.
function priorityOrder(): number[] {
  const raw = process.env.GENAI_KEY_PRIORITY;
  const parsed = raw ? raw.split(',').map(s => Number(s.trim())).filter(n => n >= 1 && n <= 6) : [];
  const base = parsed.length ? parsed : [1, 4, 2, 3, 5, 6];
  for (let i = 1; i <= 6; i++) if (!base.includes(i)) base.push(i); // ensure all slots present
  return base;
}

let _rot = 0;
/**
 * Keys to try, in order: the paid KEY_6 always first (for every request, mocks included),
 * then the free keys 1–5 rotated so their load spreads. So nothing dead-ends if KEY_6 is
 * missing or out of credit.
 */
function keysInOrder(): { key: string; label: string; keyIndex: number }[] {
  const paid = (currentMockAiKey() || process.env[`GOOGLE_GENAI_API_KEY_${PAID_KEY}`] || '').trim();
  const rest = priorityOrder()
    .filter(i => i !== PAID_KEY)
    .map(i => ({ key: process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '', label: `KEY_${i}`, keyIndex: i }))
    .filter(k => k.key.length > 0 && k.key !== paid);
  const start = rest.length > 1 ? _rot++ % rest.length : 0;
  const rotated = [...rest.slice(start), ...rest.slice(0, start)];
  return paid ? [{ key: paid, label: `KEY_${PAID_KEY}`, keyIndex: PAID_KEY }, ...rotated] : rotated;
}

/** Models to try on a key: KEY_6 walks the approved ladder; other keys keep the standard list. */
const modelsFor = (keyIndex: number, fallback: readonly { name: string; api: string }[]) =>
  keyIndex === PAID_KEY ? KEY6_MODELS : fallback;

export class AiBusyError extends Error {
  constructor() { super('AI_BUSY'); this.name = 'AiBusyError'; }
}

export interface GeminiCallResult { text: string; model: string; keyLabel: string; keyIndex: number; }

interface GeminiCallOpts {
  contents: unknown;
  systemInstruction?: unknown;
  generationConfig?: Record<string, unknown>;
  models?: readonly { name: string; api: string }[];
  deadlineMs?: number; // default 55s (inside Vercel's 60s function cap)
  attemptMs?: number; // cap per call so a hung model fails over; default: all remaining time
  /** Return false to reject a response (e.g. invalid JSON) and fail over to the next model/key. */
  validate?: (text: string) => boolean;
  /** Scoring: make the model as repeatable as Gemini allows (temperature 0, narrowest sampling, fixed seed). */
  stable?: boolean;
}

const STABLE_CONFIG = { temperature: 0, topP: 1, topK: 1, seed: 20251 };

/**
 * Calls Gemini, failing over across keys then models until one succeeds or the
 * deadline passes. Returns the response text, or throws AiBusyError so the
 * route can tell the student to try again (no hard error dump).
 */
export async function generateWithFailover(opts: GeminiCallOpts): Promise<GeminiCallResult> {
  const { contents, systemInstruction, models = GENAI_MODELS, deadlineMs = 55_000, attemptMs = deadlineMs, validate } = opts;
  const generationConfig = opts.stable ? { ...opts.generationConfig, ...STABLE_CONFIG } : opts.generationConfig;
  const deadline = Date.now() + deadlineMs;
  // Admin "use only one key" switch: that key for everything (mocks included), no switching keys.
  const mode = await getKeyMode();
  const single = mode.mode === 'single';
  const keys = single ? [{ key: mode.key, label: `KEY_${mode.slot}`, keyIndex: mode.slot }] : keysInOrder();
  if (!keys.length) throw new Error('NO_KEYS'); // distinct from AiBusy — a config problem

  const body = JSON.stringify({ contents, ...(systemInstruction ? { systemInstruction } : {}), ...(generationConfig ? { generationConfig } : {}) });

  // One request. 'busy' = rate limit / overload / network (worth another key or a wait);
  // 'skip' = this model can't answer (not found, empty, invalid JSON) → next model.
  type Outcome = { ok: GeminiCallResult } | 'busy' | 'skip';
  const tryOnce = async (key: string, label: string, keyIndex: number, model: string, api: string): Promise<Outcome> => {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
        signal: AbortSignal.timeout(Math.max(1, Math.min(attemptMs, deadline - Date.now()))),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(await res.text())?.error?.message || msg; } catch { /* ignore */ }
        return isRateLimit(res.status, msg) || isTransient(res.status, msg) ? 'busy' : 'skip';
      }
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
      return text && (!validate || validate(text)) ? { ok: { text, model, keyLabel: label, keyIndex } } : 'skip';
    } catch {
      return 'busy'; // network error / timeout
    }
  };

  if (single) {
    // One fixed key: nowhere to switch to, so a busy moment is waited out on the same key
    // (1.5s, then 3s) before moving to the next model — instead of failing straight away.
    const [{ key, label, keyIndex }] = keys;
    for (const { name: model, api } of modelsFor(keyIndex, models)) {
      for (let attempt = 0; attempt <= 2; attempt++) {
        if (Date.now() > deadline) throw new AiBusyError();
        const r = await tryOnce(key, label, keyIndex, model, api);
        if (typeof r === 'object') return r.ok;
        if (r === 'skip') break;
        const wait = 1500 * (attempt + 1);
        if (attempt === 2 || Date.now() + wait >= deadline) break;
        await sleep(wait);
      }
    }
    throw new AiBusyError();
  }

  // Automatic: outer loop keys (KEY_6 first), inner loop models.
  // KEY_6 (paid): a failing model gets one short retry, then the NEXT MODEL on KEY_6 — the key is
  // only left after its whole approved ladder has been tried. Free keys: a busy key is abandoned
  // at once, moving straight to the next key (as before).
  for (const { key, label, keyIndex } of keys) {
    const paid = keyIndex === PAID_KEY;
    for (const { name: model, api } of modelsFor(keyIndex, models)) {
      let r: Awaited<ReturnType<typeof tryOnce>> = 'skip';
      for (let attempt = 0; attempt <= (paid ? 1 : 0); attempt++) {
        if (Date.now() > deadline) throw new AiBusyError();
        r = await tryOnce(key, label, keyIndex, model, api);
        if (typeof r === 'object') return r.ok;
        if (r === 'skip' || !paid || attempt === 1 || Date.now() + 1000 >= deadline) break;
        await sleep(1000); // paid key, busy model: one quick retry
      }
      if (r === 'busy' && !paid) break; // free key busy → next key
    }
    // Brief pause before the next key so a burst doesn't hammer all keys at once.
    if (Date.now() < deadline) await sleep(150);
  }
  throw new AiBusyError();
}
