import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAiCall } from '@/lib/services/ai-usage.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── SST credit system (own pool, separate from essay & SWT credits) ────────
const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const FREE_SST_LIMIT = 2;

type CreditResult =
  | { ok: true; unlimited: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: false; status: number; code: string; message: string; extra?: any };

async function verifyCredits(uid: string): Promise<CreditResult> {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  if (UNLIMITED_ROLES.has(role)) return { ok: true, unlimited: true };
  const freeUsed = (d.sstFreeUsed as number) ?? 0;
  const paid = (d.sstPaidCredits as number) ?? 0;
  const expiry = d.sstMonthlyExpiry?.toDate?.() ?? null;
  const hasMonthly = !!(expiry && expiry > new Date());
  if (!hasMonthly && paid <= 0 && freeUsed >= FREE_SST_LIMIT) {
    return {
      ok: false, status: 402, code: 'NO_CREDITS',
      message: `You have used your ${FREE_SST_LIMIT} free SST scorings. Purchase credits to keep practising.`,
      extra: { freeUsed, freeTotal: FREE_SST_LIMIT, paidCredits: paid, hasMonthly },
    };
  }
  return { ok: true, unlimited: false };
}

async function deductSstCredit(uid: string): Promise<void> {
  const userRef = adminDb!.collection('users').doc(uid);
  const snap = await userRef.get();
  const d = snap.data() ?? {};
  const expiry = d.sstMonthlyExpiry?.toDate?.() ?? null;
  if (expiry && expiry > new Date()) return; // unlimited plan active
  const paid = (d.sstPaidCredits as number) ?? 0;
  if (paid > 0) await userRef.update({ sstPaidCredits: FieldValue.increment(-1) });
  else await userRef.update({ sstFreeUsed: FieldValue.increment(1) });
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
  } catch (e) { console.warn('[score-sst] model tracking failed:', e); }
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

// ─── 5-key round-robin pool ───────────────────────────────────────────────────
let _keyCounter = 0;

function getApiKey(): { key: string; label: string; keyIndex: number } | null {
  const keys = [1, 2, 3, 4, 5]
    .map(i => ({ key: process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '', label: `KEY_${i}`, keyIndex: i }))
    .filter(k => k.key.length > 0);
  if (keys.length === 0) return null;
  const chosen = keys[_keyCounter % keys.length];
  _keyCounter = (_keyCounter + 1) % keys.length;
  return chosen;
}

// ─── Deterministic Form scoring (official SST: 50–70 words, one summary) ─────
function scoreForm(summary: string): { form: 0 | 1 | 2; wordCount: number; reasons: string[] } {
  const trimmed = summary.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const reasons: string[] = [];

  let form: 0 | 1 | 2;
  if (wordCount >= 50 && wordCount <= 70) {
    form = 2;
    reasons.push('Within the required 50–70 word range.');
  } else if ((wordCount >= 40 && wordCount < 50) || (wordCount > 70 && wordCount <= 100)) {
    form = 1;
    reasons.push(`${wordCount} words — slightly outside the ideal 50–70 word range.`);
  } else {
    form = 0;
    reasons.push(wordCount < 40 ? 'Fewer than 40 words.' : 'More than 100 words.');
  }
  return { form, wordCount, reasons };
}

// ─── System prompt (faithful to the SST Content rubric supplied by the trainer) ──
const SYSTEM_PROMPT = `You are an expert Pearson PTE Academic examiner specializing in Summarize Spoken Text (SST). You score the response against the official Pearson marking guide and also teach the student how to improve.

You are given the LECTURE TRANSCRIPT (the reference) and the STUDENT SUMMARY. Evaluate the summary strictly against the lecture.

═══════════════════════════════════════════════
STEP 1 — UNDERSTAND THE LECTURE
Identify: the main topic, the speaker's central message, the major supporting ideas, the essential keywords, and any technical terms or names. These become the reference for evaluation.

STEP 2 — COMPARE THE STUDENT'S SUMMARY
Check whether the response: covers the main topic; includes the most important ideas; contains the essential keywords; removes unnecessary details; uses paraphrasing rather than copying; synthesizes ideas into one coherent summary; makes logical sense as a complete summary.

═══════════════════════════════════════════════
CONTENT (0–4) — apply strictly
 4 = Full understanding of the lecture; nearly all major ideas included; most essential keywords appear naturally; ideas synthesized (not listed); logical and meaningful; no irrelevant information weakening it.
 3 = Lecture understood well; most important ideas present; one or two key ideas missing; some important keywords absent; minor unnecessary information; still makes logical sense.
 2 = Only part of the lecture understood; several important ideas missing; important keywords absent; mostly repeats isolated words/phrases; ideas not properly synthesized; only partially meaningful.
 1 = Very little understanding; only a few random keywords; most important ideas missing; barely summarizes the lecture.
 0 = Does not summarize the lecture / unrelated / no logical sense / essential keywords almost completely missing / mostly random words / cannot demonstrate understanding.

CRITICAL CONTENT RULES
 Rule 1 (Keywords): The most important keywords from the lecture MUST appear. If several major keywords are missing, reduce the Content score. Do NOT award full marks just because grammar is good.
 Rule 2 (Logical meaning): The summary must communicate the speaker's intended meaning. A grammatically correct sentence that changes or loses the lecture's meaning must lose Content marks. A summary that does not make logical sense should never receive a high Content score.
 Rule 3 (Main ideas): Focus on main topic, major supporting ideas, and final conclusion. Ignore minor examples unless central.
 Rule 4 (Paraphrasing): Reward ideas expressed naturally in the student's own words. Do not reward mere repetition of lecture phrases without understanding.
 Rule 5 (Extra info): If irrelevant information changes the meaning or distracts, reduce the score.
 Rule 6 (Spelling→keywords): If a key lecture word is misspelled so it is no longer recognizable, do NOT treat it as a captured keyword and reduce Content accordingly.
 ANTI-KEYWORD-STUFFING: Do NOT award a high Content score solely because many keywords are present. The response must demonstrate understanding by presenting the keywords in a logical, meaningful summary. A collection of unrelated keywords or phrases must receive a LOW Content score.
 KEYWORD PRECISION: If the student uses only general or vague words instead of the main ideas and essential keywords, flag it clearly and reduce Content.

GRAMMAR (0–2): Award in 0.5 increments (2, 1.5, 1, 0.5, 0) based on severity and frequency of grammatical errors. Check subject-verb agreement, tense, articles, prepositions, sentence structure, run-ons, fragments.

VOCABULARY (0–2): Award in 0.5 increments (2, 1.5, 1, 0.5, 0) based on appropriateness and range of word choice.

SPELLING: Identify EVERY spelling mistake with the correct spelling. Report the exact count in "spellingMistakeCount". (The Spelling score is computed by the system: 0 mistakes = 2, 1 mistake = 1, 2+ mistakes = 0.)

(FORM is scored automatically by the system — do not score it.)

═══════════════════════════════════════════════
Return ONLY valid JSON (no markdown, no text outside the object). Do not include "form", "spelling" or "total" (computed server-side):
{
  "scores": { "content": <0-4>, "grammar": <0,0.5,1,1.5,2>, "vocabulary": <0,0.5,1,1.5,2> },
  "spellingMistakeCount": <integer count of spelling mistakes>,
  "summaryTitle": "<short honest title reflecting the result>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "mainTopic": "<the lecture's main topic>",
  "essentialKeywordsPresent": ["<essential keyword the student successfully included>", "..."],
  "essentialKeywordsMissing": ["<essential keyword from the lecture the student missed>", "..."],
  "mainIdeasCovered": ["<important idea the student covered>", "..."],
  "mainIdeasMissing": ["<important idea the student missed>", "..."],
  "logicCheck": { "level": "Excellent understanding"|"Good understanding"|"Partial understanding"|"Limited understanding"|"No meaningful understanding", "explanation": "<why>" },
  "keywordPrecisionFlag": "<empty string if fine, otherwise: 'Your summary relies on general words rather than the main points and essential keywords from the lecture. Include the key concepts discussed by the speaker to improve your Content score.'>",
  "spellingIssues": [{"incorrect":"<misspelled word>","correct":"<correct spelling>","affectedKeyword":<true|false>,"note":"<how it affected keyword recognition>"}],
  "grammarCorrections": [{"error":"<student text>","correction":"<corrected>","rule":"<grammar rule explained>"}],
  "vocabNotes": ["<vocabulary observation or improvement>", "..."],
  "strengths": ["<specific strength>", "..."],
  "improvements": ["<specific actionable improvement>", "..."],
  "finalJustification": "<3-5 sentences justifying the Content score per the rubric: comprehension, essential keywords, logical meaning, synthesis, spelling accuracy>",
  "modelAnswer": "<one high-scoring 50-70 word SST summary of THIS lecture>",
  "modelAnswerWhy": "<why this model answer would score highly>"
}`;

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return Response.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'You must be signed in to use the SST trainer.', code: 'NO_AUTH' }, { status: 401 });
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

    const { transcript, summary } = (await request.json()) as { transcript?: string; summary?: string };
    if (!transcript || !summary || !summary.trim()) {
      return Response.json({ error: 'Transcript and summary are required.' }, { status: 400 });
    }

    const apiKeyResult = getApiKey();
    if (!apiKeyResult) {
      return Response.json({ error: 'No GOOGLE_GENAI_API_KEY_1..5 keys found on the server.' }, { status: 500 });
    }
    const { key: apiKey, label: apiKeyLabel, keyIndex: apiKeyIndex } = apiKeyResult;

    const form = scoreForm(summary);

    const userMessage = `LECTURE TRANSCRIPT (reference — the student heard this as audio):
"""
${transcript}
"""

STUDENT SUMMARY (${form.wordCount} words):
"""
${summary}
"""

The system has already scored FORM = ${form.form}/2 (${form.reasons.join(' ')}). Evaluate Content, Grammar, Vocabulary and count spelling mistakes, and provide full teaching feedback per the rubric. Return only valid JSON.`;

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
              console.warn(`[score-sst] ${name} transient error, retrying (${attempt + 1})…`);
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
            console.warn(`[score-sst] ${name} exception, retrying (${attempt + 1}): ${msg}`);
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

    const usedModel = MODELS.find(m => !errorLog.some(e => e.startsWith(m.name + ':')))?.name ?? null;

    if (!responseText) {
      console.error('[score-sst] all models failed:', errorLog);
      logAiCall({ userId: uid, email: userEmail, ip, task: 'sst', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: null, success: false, isRateLimit: errorLog.some(e => e.includes('429') || e.includes('quota')), error: errorLog.join(' | '), timestamp: new Date() }).catch(() => {});
      return Response.json({ error: 'AI scoring failed. Please try again.', details: errorLog }, { status: 502 });
    }
    logAiCall({ userId: uid, email: userEmail, ip, task: 'sst', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: usedModel, success: true, isRateLimit: false, error: null, timestamp: new Date() }).catch(() => {});

    const parsed = JSON.parse(responseText);

    // ── Clamp AI-scored criteria to their allowed ranges (0.5 steps for G/V) ──
    const halfStep = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) * 2) / 2));
    const content = Math.max(0, Math.min(4, Math.round(Number(parsed?.scores?.content ?? 0))));
    let grammar = halfStep(parsed?.scores?.grammar ?? 0, 2);
    let vocabulary = halfStep(parsed?.scores?.vocabulary ?? 0, 2);

    // ── Deterministic Spelling score (per the trainer's rule) ──
    const spellingMistakeCount = Math.max(0, Math.floor(Number(parsed?.spellingMistakeCount ?? 0)));
    const spelling: 0 | 1 | 2 = spellingMistakeCount === 0 ? 2 : spellingMistakeCount === 1 ? 1 : 0;

    // Form gate: a malformed response can't earn full enabling-skill marks.
    if (form.form === 0) { grammar = Math.min(grammar, 1); vocabulary = Math.min(vocabulary, 1); }

    const total = content + form.form + grammar + vocabulary + spelling;
    const maxTotal = 12;
    const band = Math.round((total / maxTotal) * 90);

    // Deduct a credit on a successful scoring (unlimited roles bypass).
    if (!cred.unlimited) {
      try { await deductSstCredit(uid); } catch (e) { console.warn('[score-sst] credit deduct failed:', e); }
    }

    return Response.json({
      ...parsed,
      scores: { content, form: form.form, grammar, vocabulary, spelling },
      spellingMistakeCount,
      total,
      maxTotal,
      band,
      wordCount: form.wordCount,
      formReasons: form.reasons,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-sst] error:', error);
    return Response.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
