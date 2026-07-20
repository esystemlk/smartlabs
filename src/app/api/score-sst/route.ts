import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAiCall } from '@/lib/services/ai-usage.service';
import { isInternalRequest } from '@/lib/internal-auth';

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

// ─── Deterministic Form scoring ──────────────────────────────────────────────
// Official rule: 50–70 words = 2 marks. Anything else = 0. No partial marks.
function scoreForm(summary: string): { form: 0 | 2; wordCount: number; reason: string } {
  const trimmed = summary.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const ok = wordCount >= 50 && wordCount <= 70;
  return {
    form: ok ? 2 : 0,
    wordCount,
    reason: ok
      ? `${wordCount} words — within the required 50–70 range.`
      : `${wordCount} words — outside the required 50–70 range. Form is all-or-nothing, so this scores 0.`,
  };
}

// ─── System prompt — the official SST rubric supplied by the PTE trainer ─────
const SYSTEM_PROMPT = `You are an expert Pearson PTE Academic trainer and examiner. Evaluate the student's Summarize Spoken Text (SST) response using the official PTE marking criteria.

═══ THE TASK ═══
The student listens to an audio of approximately 2 minutes and writes a summary of 50–70 words. The summary should include:
- The main topic of the lecture.
- The most important key ideas discussed.
- Any additional important supporting information.
- A brief conclusion or final message if present.

The preferred structure is:
"The lecture mainly discusses... It explains... Additionally, it highlights... Finally, it concludes that..."
The wording does NOT have to match this template exactly, but the response should follow a logical flow.

═══ CONTENT (4 marks) — you score this ═══
Evaluate whether the student has accurately summarized the lecture.
 4 = Main topic accurately identified; most important ideas included; information relevant; no major missing concepts.
 3 = Main topic identified; some important points missing; mostly relevant.
 2 = Only partial understanding; several important ideas omitted; some irrelevant information.
 1 = Very limited understanding; mostly general statements; few actual lecture ideas.
 0 = Completely irrelevant; random information; off-topic.

★ IMPORTANT RULE FOR KEYWORDS ★
Do NOT award high content marks simply because the student includes isolated keywords.
A keyword must represent a meaningful CONCEPT or IDEA from the lecture.
 Good (meaningful phrases): "protecting biodiversity", "renewable energy sources", "economic development", "environmental conservation"
 Poor (isolated words): "biodiversity", "environment", "climate", "pollution"
Single random words must NOT receive credit. Keywords should normally contain at least two meaningful words that clearly represent the speaker's ideas, and must be central ideas from the lecture.
Do NOT reward: generic words, random vocabulary, repeated words, unrelated concepts.
Content marks must reflect UNDERSTANDING of the lecture rather than keyword matching.
List any isolated/generic/vague keywords the student leaned on in "weakKeywords".

═══ VOCABULARY (2 marks) — you score the BASE, system applies the penalty ═══
 2 = Varied and accurate vocabulary; academic language appropriate.
 1 = Mostly simple vocabulary; some repetition; occasional incorrect word choice.
 0 = Very poor or incorrect vocabulary; many inappropriate words.
VOCABULARY PENALTY: if frequent spelling mistakes affect word recognition, report "vocabSpellingPenalty" of 0.5 or 1 (otherwise 0), because incorrect spelling reduces lexical accuracy. The system subtracts it from your base score.

═══ GRAMMAR, SPELLING and FORM — do NOT score these ═══
The system computes them deterministically from the lists/counts you provide:
- Grammar: 0 mistakes = 2, exactly 1 mistake = 1, 2 or more = 0. List EVERY grammar mistake in "grammarMistakes" (sentence structure, verb tense, agreement, articles, prepositions, punctuation). If grammar errors make the summary difficult to understand, list them all — the count will drive the 0.
- Spelling: 0 mistakes = 2, 1–2 mistakes = 1, 3 or more = 0. List EVERY spelling mistake in "spellingMistakes".
- Form: 50–70 words = 2, otherwise 0 (system counts the words).
Be exhaustive and accurate with these lists — they directly set the marks.

═══ ADDITIONAL RULES ═══
- If there are many spelling mistakes, also consider reducing Content if important ideas become unclear, and apply the vocabulary penalty.
- Evaluate based on MEANING, not exact wording. Accept synonyms and paraphrases. Do not expect identical phrases from the lecture.
- Focus on whether the student captured the main message and key supporting ideas.
- Be fair but strict, following the PTE marking criteria consistently.

Return ONLY valid JSON (no markdown, no text outside the object). Do NOT include grammar, spelling, form or total scores — the system computes those:
{
  "scores": { "content": <0-4 integer>, "vocabularyBase": <0|1|2> },
  "vocabSpellingPenalty": <0|0.5|1>,
  "grammarMistakes": [{"error":"<student text>","correction":"<corrected>","rule":"<which grammar rule, explained simply>"}],
  "spellingMistakes": [{"incorrect":"<misspelled word>","correct":"<correct spelling>"}],
  "mainTopic": "<the lecture's main topic in one line>",
  "summaryTitle": "<short honest title reflecting the result>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "keyIdeasCovered": ["<meaningful idea/phrase the student correctly captured>", "..."],
  "missingKeyIdeas": ["<important lecture idea the student missed>", "..."],
  "weakKeywords": ["<isolated or overly general word the student used that earns no credit>", "..."],
  "vocabularyWeaknesses": ["<specific vocabulary weakness>", "..."],
  "strengths": ["<what the student genuinely did well>", "..."],
  "suggestedImprovements": ["<actionable improvement: identifying the topic, selecting meaningful key phrases instead of isolated words, grammar, vocabulary, spelling, word limit>", "..."],
  "contentJustification": "<3-5 sentences justifying the Content mark per the rubric>",
  "modelAnswer": "<a model 50-70 word summary of THIS lecture following the preferred structure>",
  "modelAnswerWhy": "<why this model answer would score full marks>"
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

    // Mock exams charge their own credit, so an internal call skips the SST pool.
    const internal = isInternalRequest(request);

    // Credit check (before spending AI quota)
    const cred = internal
      ? ({ ok: true, unlimited: true } as CreditResult)
      : await verifyCredits(uid);
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

The system has already scored FORM = ${form.form}/2 (${form.reason}).

Score CONTENT (0-4) and VOCABULARY BASE (0-2), and list EVERY grammar and spelling mistake — the system converts those lists into the Grammar and Spelling marks. Return only valid JSON.`;

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

    // ── Content: AI-judged, clamped to 0-4 ──
    const content = Math.max(0, Math.min(4, Math.round(Number(parsed?.scores?.content ?? 0))));

    // ── Grammar & Spelling: computed from the AI's mistake lists so the
    //    official thresholds are applied exactly and can't drift. ──
    const grammarMistakes = Array.isArray(parsed?.grammarMistakes) ? parsed.grammarMistakes : [];
    const spellingMistakes = Array.isArray(parsed?.spellingMistakes) ? parsed.spellingMistakes : [];

    const grammarMistakeCount = grammarMistakes.length;
    const grammar: 0 | 1 | 2 =
      grammarMistakeCount === 0 ? 2 : grammarMistakeCount === 1 ? 1 : 0;

    const spellingMistakeCount = spellingMistakes.length;
    const spelling: 0 | 1 | 2 =
      spellingMistakeCount === 0 ? 2 : spellingMistakeCount <= 2 ? 1 : 0;

    // ── Vocabulary: AI base (0-2) minus the spelling penalty (0 / 0.5 / 1) ──
    const vocabBase = Math.max(0, Math.min(2, Math.round(Number(parsed?.scores?.vocabularyBase ?? 0))));
    const rawPenalty = Number(parsed?.vocabSpellingPenalty ?? 0);
    const vocabSpellingPenalty = [0, 0.5, 1].includes(rawPenalty) ? rawPenalty : 0;
    const vocabulary = Math.max(0, vocabBase - vocabSpellingPenalty);

    const total = content + grammar + vocabulary + spelling + form.form;
    const maxTotal = 12;
    const band = Math.round((total / maxTotal) * 90);

    // Deduct a credit on a successful scoring (unlimited roles bypass).
    if (!cred.unlimited) {
      try { await deductSstCredit(uid); } catch (e) { console.warn('[score-sst] credit deduct failed:', e); }
    }

    return Response.json({
      ...parsed,
      scores: { content, grammar, vocabulary, spelling, form: form.form },
      grammarMistakes,
      spellingMistakes,
      grammarMistakeCount,
      spellingMistakeCount,
      vocabBase,
      vocabSpellingPenalty,
      total,
      maxTotal,
      band,
      wordCount: form.wordCount,
      formReason: form.reason,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-sst] error:', error);
    return Response.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
