import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAiCall } from '@/lib/services/ai-usage.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── SWT credit system (own pool, separate from essay credits) ──────────────
const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const FREE_SWT_LIMIT = 2;

type CreditResult =
  | { ok: true; unlimited: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: false; status: number; code: string; message: string; extra?: any };

async function verifyCredits(uid: string): Promise<CreditResult> {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  if (UNLIMITED_ROLES.has(role)) return { ok: true, unlimited: true };
  const freeUsed = (d.swtFreeUsed as number) ?? 0;
  const paid = (d.swtPaidCredits as number) ?? 0;
  const expiry = d.swtMonthlyExpiry?.toDate?.() ?? null;
  const hasMonthly = !!(expiry && expiry > new Date());
  if (!hasMonthly && paid <= 0 && freeUsed >= FREE_SWT_LIMIT) {
    return {
      ok: false, status: 402, code: 'NO_CREDITS',
      message: `You have used your ${FREE_SWT_LIMIT} free SWT scorings. Purchase credits to keep practising.`,
      extra: { freeUsed, freeTotal: FREE_SWT_LIMIT, paidCredits: paid, hasMonthly },
    };
  }
  return { ok: true, unlimited: false };
}

async function deductSwtCredit(uid: string): Promise<void> {
  const userRef = adminDb!.collection('users').doc(uid);
  const snap = await userRef.get();
  const d = snap.data() ?? {};
  const expiry = d.swtMonthlyExpiry?.toDate?.() ?? null;
  if (expiry && expiry > new Date()) return; // unlimited plan active
  const paid = (d.swtPaidCredits as number) ?? 0;
  if (paid > 0) await userRef.update({ swtPaidCredits: FieldValue.increment(-1) });
  else await userRef.update({ swtFreeUsed: FieldValue.increment(1) });
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const MAX_MODEL_RETRIES = 2;

async function trackModelUsage(model: string, success: boolean, errorMsg?: string) {
  try {
    if (!adminDb) return;
    const ref = adminDb.collection('system_config').doc('model_usage');
    const snap = await ref.get();
    const data = snap.data() ?? {};
    const models: Record<string, Record<string, unknown>> = (data.models as Record<string, Record<string, unknown>>) ?? {};
    const m = (models[model] ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      totalRequests: ((data.totalRequests as number) ?? 0) + 1,
      [`models.${model}.successCount`]: ((m.successCount as number) ?? 0) + (success ? 1 : 0),
      [`models.${model}.failureCount`]: ((m.failureCount as number) ?? 0) + (success ? 0 : 1),
      [`models.${model}.lastUsedAt`]: new Date(),
      [`models.${model}.lastStatus`]: success ? 'active' : 'exhausted',
    };
    if (!success && errorMsg) patch[`models.${model}.lastError`] = errorMsg;
    try { await ref.update(patch); } catch {
      await ref.set({ totalRequests: 1, models: { [model]: { successCount: success ? 1 : 0, failureCount: success ? 0 : 1, lastUsedAt: new Date(), lastStatus: success ? 'active' : 'exhausted', lastError: !success && errorMsg ? errorMsg : '' } } });
    }
  } catch (e) { console.warn('[score-swt] model tracking failed:', e); }
}

const isTransient = (status: number, msg: string) =>
  (status === 500 || status === 502 || status === 503 || status === 504) ||
  msg.toLowerCase().includes('overload') || msg.toLowerCase().includes('high demand') ||
  msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('internal') ||
  msg.toLowerCase().includes('unavailable');

const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro', api: 'v1beta' },
];

// ─── API key cache (same pattern as score-essay) ────────────────────────────
let _cachedFirestoreKey: string | null = null;
let _cacheExpiry = 0;
let _cacheVersion = 0;
let _envKeyCounter = 0;
const CACHE_TTL_MS = 2 * 60 * 1000;

function getEnvKeys(): { key: string; label: string; index: number }[] {
  // Priority 1: dedicated single env key (valid AIza... REST API key)
  const single = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
  if (single) return [{ key: single, label: 'ENV_KEY', index: 0 }];

  // Priority 2: numbered pool (GOOGLE_GENAI_API_KEY_1..5)
  const numbered = [1, 2, 3, 4, 5]
    .map(i => ({ key: process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '', label: `KEY_${i}`, index: i }))
    .filter(k => k.key.length > 0);
  return numbered;
}

async function getApiKey(): Promise<{ key: string; label: string; keyIndex: number | null } | null> {
  // 1. Try Firestore-managed key first
  try {
    if (adminDb) {
      const ccSnap = await adminDb.collection('system_config').doc('cache_control').get();
      const remoteVersion: number = ccSnap.exists ? (ccSnap.data()?.keyVersion ?? 0) : 0;
      const valid = _cachedFirestoreKey && Date.now() < _cacheExpiry && _cacheVersion === remoteVersion;
      if (!valid) {
        const snap = await adminDb.collection('system_config').doc('ai_settings').get();
        const key = snap.exists ? (snap.data()?.geminiApiKey as string | undefined) : undefined;
        if (key) {
          _cachedFirestoreKey = key;
          _cacheExpiry = Date.now() + CACHE_TTL_MS;
          _cacheVersion = remoteVersion;
          return { key, label: 'FIRESTORE_KEY', keyIndex: null };
        }
        _cachedFirestoreKey = null;
        _cacheExpiry = 0;
        _cacheVersion = remoteVersion;
      } else if (_cachedFirestoreKey) {
        return { key: _cachedFirestoreKey, label: 'FIRESTORE_KEY', keyIndex: null };
      }
    }
  } catch (e) {
    console.warn('[score-swt] key read failed, env pool fallback:', e);
  }
  // 2. Fall back to GOOGLE_GENAI_API_KEY_1..5 round-robin pool
  const envKeys = getEnvKeys();
  if (envKeys.length === 0) return null;
  const chosen = envKeys[_envKeyCounter % envKeys.length];
  _envKeyCounter = (_envKeyCounter + 1) % envKeys.length;
  console.log(`[score-swt] Using env pool key: ${chosen.label}`);
  return { key: chosen.key, label: chosen.label, keyIndex: chosen.index || null };
}

// ─── Deterministic Form scoring (official SWT rules) ────────────────────────
function scoreForm(summary: string): { form: 0 | 1; wordCount: number; reasons: string[] } {
  const trimmed = summary.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const reasons: string[] = [];

  // A sentence boundary = a terminator (.?!) followed by whitespace and more text.
  const hasEarlySentenceBreak = /[.!?]+\s+\S/.test(trimmed);
  const hasLetters = /[a-z]/i.test(trimmed);
  const allCaps = hasLetters && trimmed === trimmed.toUpperCase();

  let form: 0 | 1 = 1;
  if (wordCount < 5) { form = 0; reasons.push('Fewer than 5 words.'); }
  if (wordCount > 75) { form = 0; reasons.push('More than 75 words.'); }
  if (hasEarlySentenceBreak) { form = 0; reasons.push('Not a single sentence — a full stop appears before the end.'); }
  if (allCaps) { form = 0; reasons.push('Response is written in all capital letters.'); }
  if (form === 1) reasons.push('One complete sentence within the 5–75 word limit.');

  return { form, wordCount, reasons };
}

// ─── System prompt (faithful to the SWT master document) ────────────────────
const SYSTEM_PROMPT = `You are an expert PTE Academic Summarize Written Text (SWT) examiner, trainer, and coach. You do NOT just score — you teach the student to think like a high-scoring SWT candidate.

CORE TRUTH: SWT is primarily a READING and THINKING task, not a writing task. Idea selection matters more than grammar or vocabulary. A summary is ONE complete sentence containing only the MOST IMPORTANT ideas (main topic + major ideas + relationships), with details removed.

═══ OFFICIAL SCORING ═══
CONTENT (0-4):
 4 = full comprehension, main topic + all important ideas, synthesized, unnecessary details omitted, coherent.
 3 = good comprehension, most important ideas, minor omissions, generally coherent.
 2 = partial comprehension, several important ideas missing, heavy copying, weak synthesis.
 1 = limited comprehension, only one/few ideas, major ideas missing.
 0 = no meaningful summary / misunderstanding / irrelevant.

GRAMMAR (0-2): 2 = correct structure; 1 = minor errors not hindering meaning; 0 = serious errors hindering meaning. Check subject-verb agreement, tense, articles, prepositions, sentence structure, run-ons, fragments.

VOCABULARY (0-2): 2 = appropriate accurate word choice; 1 = minor lexical errors; 0 = poor word choice hindering meaning.

(FORM is scored automatically by the system — do not score it.)

SPELLING: there is NO separate spelling score, but spelling errors can hurt Vocabulary/Grammar/clarity. Identify every spelling mistake with the correct spelling.

═══ HOW TO TEACH ═══
- Identify the main topic, the 2–5 major ideas, supporting ideas, and details that should NOT appear (examples, statistics, dates, names, case studies, quotes, repetition).
- For EACH sentence of the source, decide PICK or SKIP, give importance (High/Medium/Low) and a clear reason. Skip examples/statistics/dates/names/repetition; pick topic, causes, effects, problems, solutions, comparisons, conclusions.
- Recognize synonyms/paraphrasing/alternative structures — evaluate meaning, not exact words.
- Coach connectors (addition: and/moreover/furthermore; contrast: but/however/yet; comparison: while/whereas; cause-effect: because/therefore/thus/consequently; purpose: to/in order to/so that; concession: although/even though/despite) and recommend a comma before major connecting words joining large ideas.
- Be encouraging, analytical, specific. Never just say "wrong" — explain what happened, why, how to fix it, how to avoid it next time.

═══ MODEL ANSWER ═══
Provide ONE high-scoring summary sentence (clear synthesis, proper connectors, strong grammar, appropriate vocabulary, no unnecessary details) and explain why it scores highly.

Return ONLY valid JSON (no markdown, no text outside the object). Do not include "form" or "total" (computed server-side):
{
  "scores": { "content": <0-4>, "grammar": <0-2>, "vocabulary": <0-2> },
  "summaryTitle": "<short honest title reflecting the result>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "mainTopic": "<the overall subject of the passage>",
  "mainIdeas": ["<major idea 1>", "<major idea 2>", "..."],
  "supportingIdeas": ["<important supporting info>", "..."],
  "detailsToOmit": ["<example/stat/date/name/etc that should NOT be in the summary>", "..."],
  "sentenceSelection": [
    {"sentence":"<exact source sentence>","decision":"pick"|"skip","importance":"High"|"Medium"|"Low","reason":"<why>"}
  ],
  "strengths": ["<specific strength>", "..."],
  "missingIdeas": ["<important idea the student missed>", "..."],
  "grammarCorrections": [{"error":"<student text>","correction":"<corrected>","rule":"<grammar rule explained>"}],
  "vocabSpellingCorrections": [{"incorrect":"<wrong word/spelling>","correct":"<correct>","explanation":"<why>"}],
  "connectorCoaching": "<analysis of the student's connector & comma usage with concrete improvements>",
  "examStrategy": "<personalized SWT strategy advice (read 1-2 min, find topic+ideas 3-4 min, write 5-7 min, check grammar 8-9, spelling/punctuation 10)>",
  "modelAnswer": "<one-sentence full-score SWT summary>",
  "modelAnswerWhy": "<why this model answer would score highly>"
}`;

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return Response.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'You must be signed in to use the SWT trainer.', code: 'NO_AUTH' }, { status: 401 });
    }
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
    } catch {
      return Response.json({ error: 'Your session has expired. Please sign in again.', code: 'INVALID_AUTH' }, { status: 401 });
    }

    // ── Tracking metadata ─────────────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? request.headers.get('x-real-ip')
            ?? null;
    let userEmail: string | null = null;
    try {
      const userRecord = await adminAuth.getUser(uid);
      userEmail = userRecord.email ?? null;
    } catch { /* non-fatal */ }

    // Credit check (before spending AI quota)
    const cred = await verifyCredits(uid);
    if (!cred.ok) {
      return Response.json({ error: cred.message, code: cred.code, ...(cred.extra ?? {}) }, { status: cred.status });
    }

    const { passage, summary } = (await request.json()) as { passage?: string; summary?: string };
    if (!passage || !summary || !summary.trim()) {
      return Response.json({ error: 'Passage and summary are required.' }, { status: 400 });
    }

    const apiKeyResult = await getApiKey();
    if (!apiKeyResult) {
      return Response.json({ error: 'AI key not configured on the server.' }, { status: 500 });
    }
    const { key: apiKey, label: apiKeyLabel, keyIndex: apiKeyIndex } = apiKeyResult;

    const form = scoreForm(summary);

    const userMessage = `SOURCE PASSAGE:
"""
${passage}
"""

STUDENT SUMMARY (${form.wordCount} words):
"""
${summary}
"""

The system has already scored FORM = ${form.form}/1 (${form.reasons.join(' ')}). Evaluate Content, Grammar and Vocabulary, and provide full teaching feedback. Return only valid JSON.`;

    let responseText = '';
    const errorLog: string[] = [];

    for (const { name, api } of MODELS) {
      const generationConfig: Record<string, unknown> = { temperature: 0.2, maxOutputTokens: 8192 };
      if (name.includes('flash')) generationConfig.thinkingConfig = { thinkingBudget: 0 };

      let modelSucceeded = false;

      for (let attempt = 0; attempt <= MAX_MODEL_RETRIES; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/${api}/models/${name}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: userMessage }] }],
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig,
            }),
          });
          if (!res.ok) {
            const t = await res.text().catch(() => '');
            const msg = `HTTP ${res.status} ${t.slice(0, 200)}`;
            const isQuota = res.status === 429;
            if (!isQuota && isTransient(res.status, t) && attempt < MAX_MODEL_RETRIES) {
              console.warn(`[score-swt] ${name} transient error, retrying (${attempt + 1})…`);
              await sleep(1500 * (attempt + 1));
              continue;
            }
            errorLog.push(`${name}: ${msg}`);
            trackModelUsage(name, false, res.status === 429 ? 'QUOTA_EXCEEDED' : `HTTP_${res.status}`).catch(() => {});
            break;
          }
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join('') ?? '';
          if (!text) {
            if (attempt < MAX_MODEL_RETRIES) { await sleep(1500 * (attempt + 1)); continue; }
            errorLog.push(`${name}: empty`);
            trackModelUsage(name, false, 'EMPTY_RESPONSE').catch(() => {});
            break;
          }
          let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          const start = cleaned.indexOf('{');
          const end = cleaned.lastIndexOf('}');
          if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
          JSON.parse(cleaned); // validate
          responseText = cleaned;
          trackModelUsage(name, true).catch(() => {});
          modelSucceeded = true;
          break;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (isTransient(0, msg) && attempt < MAX_MODEL_RETRIES) {
            console.warn(`[score-swt] ${name} exception, retrying (${attempt + 1}): ${msg}`);
            await sleep(1500 * (attempt + 1));
            continue;
          }
          errorLog.push(`${name}: ${msg}`);
          trackModelUsage(name, false, 'EXCEPTION').catch(() => {});
          break;
        }
      }

      if (modelSucceeded) break;
    }

    // find which model succeeded (last model whose errorLog doesn't include it)
    const usedModel = MODELS.find(m => !errorLog.some(e => e.startsWith(m.name + ':')))?.name ?? null;

    if (!responseText) {
      console.error('[score-swt] all models failed:', errorLog);
      logAiCall({ userId: uid, email: userEmail, ip, task: 'swt', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: null, success: false, isRateLimit: errorLog.some(e => e.includes('429') || e.includes('quota')), error: errorLog.join(' | '), timestamp: new Date() }).catch(() => {});
      return Response.json({ error: 'AI scoring failed. Please try again.', details: errorLog }, { status: 502 });
    }
    logAiCall({ userId: uid, email: userEmail, ip, task: 'swt', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: usedModel, success: true, isRateLimit: false, error: null, timestamp: new Date() }).catch(() => {});

    const parsed = JSON.parse(responseText);
    const content = Math.max(0, Math.min(4, Number(parsed?.scores?.content ?? 0)));
    let grammar = Math.max(0, Math.min(2, Number(parsed?.scores?.grammar ?? 0)));
    let vocabulary = Math.max(0, Math.min(2, Number(parsed?.scores?.vocabulary ?? 0)));

    // Form gate: if Form = 0, the response is invalid as a summary — enabling
    // skills can't be credited fully on a malformed response.
    if (form.form === 0) { grammar = Math.min(grammar, 1); vocabulary = Math.min(vocabulary, 1); }

    const total = content + form.form + grammar + vocabulary;

    // Deduct a credit on a successful scoring (unlimited roles bypass).
    if (!cred.unlimited) {
      try { await deductSwtCredit(uid); } catch (e) { console.warn('[score-swt] credit deduct failed:', e); }
    }

    return Response.json({
      ...parsed,
      scores: { content, form: form.form, grammar, vocabulary },
      total,
      maxTotal: 9,
      wordCount: form.wordCount,
      formReasons: form.reasons,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-swt] error:', error);
    return Response.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
