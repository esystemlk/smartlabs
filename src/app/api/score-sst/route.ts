import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { logAiCall } from '@/lib/services/ai-usage.service';
import { isInternalRequest } from '@/lib/internal-auth';
import { hasCreditFor, deductionFor, type PoolConfig } from '@/lib/services/ai-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── SST credit system (own pool + shared universal pool) ───────────────────
const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const FREE_SST_LIMIT = 2;
const SST_POOL: PoolConfig = { paid: 'sstPaidCredits', monthly: 'sstMonthlyExpiry', free: 'sstFreeUsed', freeLimit: FREE_SST_LIMIT };

type CreditResult =
  | { ok: true; unlimited: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: false; status: number; code: string; message: string; extra?: any };

async function verifyCredits(uid: string): Promise<CreditResult> {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  if (UNLIMITED_ROLES.has(role)) return { ok: true, unlimited: true };
  // Eligible if this pool OR the shared universal pool can cover the use.
  if (hasCreditFor(d, SST_POOL)) return { ok: true, unlimited: false };
  const freeUsed = (d.sstFreeUsed as number) ?? 0;
  return {
    ok: false, status: 402, code: 'NO_CREDITS',
    message: freeUsed >= 1
      ? `You have used your ${FREE_SST_LIMIT} free SST scorings. Purchase credits to keep practising.`
      : 'Free AI scoring is no longer available on new accounts. Please purchase credits to start scoring.',
    extra: { freeUsed, paidCredits: (d.sstPaidCredits as number) ?? 0, universalPaidCredits: (d.universalPaidCredits as number) ?? 0 },
  };
}

async function deductSstCredit(uid: string): Promise<void> {
  const userRef = adminDb!.collection('users').doc(uid);
  await adminDb!.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const d = snap.data() ?? {};
    if (UNLIMITED_ROLES.has((d.role as string) ?? 'student')) return;
    const upd = deductionFor(d, SST_POOL);
    if (upd) tx.update(userRef, upd);
  });
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
// Official SST word-count rule (per trainer spec):
//   50–70 words → 2/2 (required range)
//   35–49 words → 1/2 (below minimum)
//   below 35    → 0/2 (far below minimum)
//   71–80 words → 1/2 (above maximum)
//   81+ words   → 0/2 (far above maximum)
function scoreForm(summary: string): { form: 0 | 1 | 2; wordCount: number; reason: string } {
  const trimmed = summary.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

  let form: 0 | 1 | 2;
  let reason: string;
  if (wordCount >= 50 && wordCount <= 70) {
    form = 2; reason = `${wordCount} words — within the required 50–70 range.`;
  } else if (wordCount >= 35 && wordCount <= 49) {
    form = 1; reason = `${wordCount} words — below the 50-word minimum (35–49 scores 1/2).`;
  } else if (wordCount >= 71 && wordCount <= 80) {
    form = 1; reason = `${wordCount} words — above the 70-word maximum (71–80 scores 1/2).`;
  } else if (wordCount < 35) {
    form = 0; reason = `${wordCount} words — far below the minimum (under 35 scores 0/2).`;
  } else {
    form = 0; reason = `${wordCount} words — far above the maximum (81+ scores 0/2).`;
  }
  return { form, wordCount, reason };
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

You MUST compare the student's response directly with the transcript before awarding marks. The purpose is to determine whether the student understood the MAIN MEANING of the audio and summarized the important information within the word limit.

═══ CONTENT (4 marks) — you score this ═══
Content is the most important criterion. First, internally analyse the transcript and identify: the main topic, main idea/message, main points, important supporting points, key facts/causes/effects/results/examples/arguments, and any conclusion/outcome/implication. Then compare those against the student's response.

★ KEY-PHRASE / INFORMATION-UNIT REQUIREMENT ★
For full Content marks the response should contain a MINIMUM of 6 meaningful key phrases, concepts, or information units from the audio.
- A key phrase need NOT be long — a short phrase or small group of words is fine as long as it carries a meaningful piece of information (a concept, cause, effect, result, fact, finding, argument, problem, solution, process, comparison, or important supporting detail).
- Do NOT count as key phrases: articles, prepositions, conjunctions, generic words, repeated information, meaningless copied words, information unrelated to the audio, information invented by the student, or the same idea expressed multiple times.
- Paraphrasing is completely acceptable — the wording does NOT have to match the transcript as long as the meaning is accurately preserved. Focus on MEANING, not exact wording.
Report the number you counted in "keyPhraseCount" and list the actual ones in "keyIdeasCovered".

EXPECTED STRUCTURE: MAIN TOPIC + MAIN POINTS + ADDITIONAL/SUPPORTING POINTS + SUMMARY/CONCLUSION. The final part should give an appropriate overall summary/conclusion/result/implication when the audio provides one.

CONTENT SCORING (drive this by the meaningful key-phrase count AND coverage):
 4 = Main topic correctly identified; main meaning accurately represented; AT LEAST 6 meaningful key phrases; important main points + relevant supporting info included; forms a meaningful summary with an appropriate conclusion where relevant; no major distortion.
 3 = Main topic correct; overall meaning substantially correct; ~4–5 meaningful key phrases; several main points included; some supporting info or the conclusion may be missing/weak.
 2 = General topic understood; ~2–3 meaningful key phrases; several important main points missing; too general or incomplete; conclusion weak/missing.
 1 = Very limited understanding; only 1 clear meaningful key phrase; most important information missing.
 0 = Does not meaningfully represent the audio; main topic incorrect/absent; no meaningful key info; mostly irrelevant, invented, or inaccurate.

IMPORTANT CONTENT RULE: Do NOT give high Content marks merely because the English sounds fluent or grammatically correct. A grammatically perfect response that fails to capture the important information MUST lose Content marks. Conversely, accurate paraphrasing counts fully.

═══ VOCABULARY (2 marks) — you score this (0-2 integer) ═══
Advanced vocabulary is NOT required — accuracy and appropriateness matter more than difficulty.
 2 = Vocabulary appropriately and accurately communicates the audio content; meaningful in context; no significant errors affecting meaning.
 1 = Some vocabulary appropriate, but noticeable incorrect/awkward/repetitive/inappropriate word choices; meaning still understandable.
 0 = Seriously limited or inaccurate vocabulary; wrong word choices substantially interfere with meaning.
Do NOT deduct Vocabulary marks just because the student uses simple English — simple but accurate vocabulary can score 2. Do NOT treat a spelling error as a vocabulary error (spelling has its own score).

═══ GRAMMAR, SPELLING and FORM — do NOT score these ═══
The system computes them deterministically from the lists/counts you provide:
- Grammar: 0 mistakes = 2, exactly 1 mistake = 1, 2 or more = 0 (capped). List EVERY significant grammar mistake in "grammarMistakes" (sentence structure, verb tense, agreement, articles, prepositions, punctuation). Do NOT list the same repeated construction problem more than once, and do not flag mere style preferences.
- Spelling: 0 mistakes = 2, exactly 1 mistake = 1, 2 or more = 0 (capped). List EVERY spelling mistake in "spellingMistakes". Do not confuse a spelling error with a vocabulary error.
- Form: word-count based, system counts the words.
Be exhaustive and accurate with these lists — they directly set the marks.

═══ ADDITIONAL RULES ═══
- Always compare the response with the transcript. Evaluate based on MEANING, not exact wording — accept synonyms and paraphrases.
- Be consistent: two responses with similar content coverage and language accuracy should get comparable scores.

Return ONLY valid JSON (no markdown, no text outside the object). Do NOT include grammar, spelling, form or total scores — the system computes those:
{
  "scores": { "content": <0-4 integer>, "vocabulary": <0|1|2> },
  "keyPhraseCount": <integer — how many meaningful key phrases/information units from the audio the student captured>,
  "mainTopicIdentified": "Yes" | "Partially" | "No",
  "summaryConclusion": "Strong" | "Acceptable" | "Weak" | "Missing",
  "grammarMistakes": [{"error":"<student text>","correction":"<corrected>","rule":"<which grammar rule, explained simply>"}],
  "spellingMistakes": [{"incorrect":"<misspelled word>","correct":"<correct spelling>"}],
  "mainTopic": "<the lecture's main topic in one line>",
  "summaryTitle": "<short honest title reflecting the result>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "keyIdeasCovered": ["<meaningful idea/phrase the student correctly captured>", "..."],
  "missingKeyIdeas": ["<important lecture idea the student missed>", "..."],
  "vocabularyWeaknesses": ["<specific vocabulary weakness>", "..."],
  "strengths": ["<what the student genuinely did well>", "..."],
  "suggestedImprovements": ["<actionable improvement: identifying the topic, capturing more meaningful key phrases, grammar, vocabulary, spelling, word limit>", "..."],
  "contentJustification": "<3-5 sentences justifying the Content mark — state whether the main topic was identified, which key points were captured, what was missed, and whether the 6 key-phrase target was reached>",
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

    // Spelling (capped at 2): 0 mistakes = 2, exactly 1 = 1, 2 or more = 0.
    const spellingMistakeCount = spellingMistakes.length;
    const spelling: 0 | 1 | 2 =
      spellingMistakeCount === 0 ? 2 : spellingMistakeCount === 1 ? 1 : 0;

    // ── Vocabulary: AI-judged 0-2 (spelling is scored separately, not double-counted) ──
    const vocabulary = Math.max(0, Math.min(2, Math.round(Number(parsed?.scores?.vocabulary ?? 0))));

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
