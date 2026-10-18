// Shared Gemini REST caller with multi-KEY + multi-MODEL failover and a time
// budget. The fetch-based scorers used to pick ONE key and only retry that key,
// so a single bad/rate-limited key dead-ended the student. This tries other
// keys automatically (preferring the ones most likely to work) and only gives
// up after the deadline — at which point the caller shows a soft "try again".

export const GENAI_MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
] as const;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const isRateLimit = (status: number, msg: string) =>
  status === 429 || /quota|rate limit|resource_exhausted/i.test(msg);
const isTransient = (status: number, msg: string) =>
  status === 500 || status === 502 || status === 503 || status === 504 ||
  /overload|high demand|timeout|internal|unavailable|temporar/i.test(msg);

// Preferred key order. Defaults to 1,4,2,3,5 (the keys currently most reliable);
// override with GENAI_KEY_PRIORITY="1,4,2,3,5" without a redeploy of this file.
function priorityOrder(): number[] {
  const raw = process.env.GENAI_KEY_PRIORITY;
  const parsed = raw ? raw.split(',').map(s => Number(s.trim())).filter(n => n >= 1 && n <= 5) : [];
  const base = parsed.length ? parsed : [1, 4, 2, 3, 5];
  for (let i = 1; i <= 5; i++) if (!base.includes(i)) base.push(i); // ensure all slots present
  return base;
}

let _rot = 0;
/** Present keys, in priority order, rotated so load spreads across them. */
function keysInOrder(): { key: string; label: string; keyIndex: number }[] {
  const order = priorityOrder();
  const present = order
    .map(i => ({ key: process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '', label: `KEY_${i}`, keyIndex: i }))
    .filter(k => k.key.length > 0);
  if (present.length <= 1) return present;
  const start = _rot++ % present.length;
  return [...present.slice(start), ...present.slice(0, start)];
}

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
  /** Return false to reject a response (e.g. invalid JSON) and fail over to the next model/key. */
  validate?: (text: string) => boolean;
}

/**
 * Calls Gemini, failing over across keys then models until one succeeds or the
 * deadline passes. Returns the response text, or throws AiBusyError so the
 * route can tell the student to try again (no hard error dump).
 */
export async function generateWithFailover(opts: GeminiCallOpts): Promise<GeminiCallResult> {
  const { contents, systemInstruction, generationConfig, models = GENAI_MODELS, deadlineMs = 55_000, validate } = opts;
  const deadline = Date.now() + deadlineMs;
  const keys = keysInOrder();
  if (!keys.length) throw new Error('NO_KEYS'); // distinct from AiBusy — a config problem

  const body = JSON.stringify({ contents, ...(systemInstruction ? { systemInstruction } : {}), ...(generationConfig ? { generationConfig } : {}) });

  // Outer loop: keys (priority-ordered). Inner loop: models. A bad key is
  // abandoned the moment it errors, moving straight to the next key.
  for (const { key, label, keyIndex } of keys) {
    for (const { name: model, api } of models) {
      if (Date.now() > deadline) throw new AiBusyError();
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { msg = JSON.parse(await res.text())?.error?.message || msg; } catch { /* ignore */ }
          // Rate-limited or transient → try the next key/model immediately.
          if (isRateLimit(res.status, msg) || isTransient(res.status, msg)) break; // next key
          continue; // other model error (e.g. model not found) → try next model
        }
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
        if (text && (!validate || validate(text))) return { text, model, keyLabel: label, keyIndex };
        // Empty / invalid (safety block, bad JSON) → try next model, then next key.
        continue;
      } catch {
        break; // network error on this key → next key
      }
    }
    // Brief pause before the next key so a burst doesn't hammer all keys at once.
    if (Date.now() < deadline) await sleep(150);
  }
  throw new AiBusyError();
}
