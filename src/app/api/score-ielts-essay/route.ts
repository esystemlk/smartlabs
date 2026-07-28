import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAiCall } from '@/lib/services/ai-usage.service';
import { isInternalRequest } from '@/lib/internal-auth';
import { ieltsOverallBand, ieltsBandLabel } from '@/types/ielts-essay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── Retry / model infra (mirrors the PTE essay scorer) ──────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const MAX_MODEL_RETRIES = 2;

const isTransient = (status: number, msg: string) =>
  status === 500 || status === 502 || status === 503 || status === 504 ||
  /overload|high demand|timeout|internal|unavailable/i.test(msg);

const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
];

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

function extractJson(text: string): string {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.substring(start, end + 1);
  return cleaned.trim();
}

// ─── Credit gate — own IELTS pool, independent of PTE ─────────────────────────
const FREE_IELTS_ESSAY_LIMIT = 2;
const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);

type AuthResult =
  | { ok: false; status: number; code: string; message: string; extra?: Record<string, unknown> }
  | { ok: true; uid: string; unlimited: boolean };

async function verifyAuthAndCredits(authHeader: string | null, internal: boolean): Promise<AuthResult> {
  if (!adminAuth || !adminDb) {
    return { ok: false, status: 500, code: 'NO_SERVER', message: 'Server not configured.' };
  }
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, code: 'UNAUTHENTICATED', message: 'Please sign in to score your essay.' };
  }
  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return { ok: false, status: 401, code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' };
  }

  // A verified internal call (future IELTS mock) charges its own credit.
  if (internal) return { ok: true, uid, unlimited: true };

  const snap = await adminDb.collection('users').doc(uid).get();
  const data = snap.data() ?? {};
  if (UNLIMITED_ROLES.has(data.role as string)) return { ok: true, uid, unlimited: true };

  const now = Date.now();
  const monthlyExpiry = (data.ieltsEssayMonthlyExpiry as number) ?? 0;
  const hasMonthly = monthlyExpiry > now;
  const paid = (data.ieltsEssayPaidCredits as number) ?? 0;
  const freeUsed = (data.ieltsEssayFreeUsed as number) ?? 0;

  if (!hasMonthly && paid <= 0 && freeUsed >= FREE_IELTS_ESSAY_LIMIT) {
    return {
      ok: false, status: 402, code: 'NO_IELTS_CREDITS',
      message: `You have used your ${FREE_IELTS_ESSAY_LIMIT} free IELTS essay scorings. Purchase credits to keep practising.`,
      extra: { freeUsed, freeTotal: FREE_IELTS_ESSAY_LIMIT, paidCredits: paid, hasMonthly },
    };
  }
  return { ok: true, uid, unlimited: false };
}

async function deductIeltsCredit(uid: string): Promise<void> {
  try {
    if (!adminDb) return;
    const ref = adminDb.collection('users').doc(uid);
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.data() ?? {};
      if (UNLIMITED_ROLES.has(data.role as string)) return;
      const now = Date.now();
      const hasMonthly = ((data.ieltsEssayMonthlyExpiry as number) ?? 0) > now;
      if (hasMonthly) return; // subscription — nothing to decrement
      const paid = (data.ieltsEssayPaidCredits as number) ?? 0;
      if (paid > 0) tx.update(ref, { ieltsEssayPaidCredits: FieldValue.increment(-1) });
      else tx.update(ref, { ieltsEssayFreeUsed: FieldValue.increment(1) });
    });
  } catch (e) {
    console.warn('[score-ielts-essay] credit deduction failed:', e);
  }
}

// ─── Examiner prompt (Lahiruka's rubric → structured JSON) ────────────────────
const SYSTEM_PROMPT = `You are a highly experienced IELTS Academic Writing Task 2 examiner, trained to evaluate essays strictly according to the official IELTS Writing Band Descriptors.

Your role is NOT to encourage the student or inflate scores. Provide an objective, evidence-based evaluation exactly as an IELTS examiner would.

Use ONLY the four official assessment criteria:
1. Task Response (TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Each criterion receives a band from 0 to 9, including HALF bands (e.g. 6.5) where appropriate.

MARKING PRINCIPLES
- Never guess a score. Every score must be justified with evidence from the student's essay.
- If evidence is insufficient, award the LOWER band.
- Do not reward memorized language unless it is used naturally.
- Penalize: irrelevant ideas, off-topic paragraphs, unsupported claims, repetition, grammatical mistakes, inaccurate vocabulary, unnatural collocations, weak paragraph development, poor cohesion, and failure to answer every part of the question.
- Be conservative rather than generous. If uncertain between two bands, award the LOWER band unless there is clear evidence for the higher one.

TASK RESPONSE — does the essay answer ALL parts? Is the position clear and maintained? Are ideas fully developed, explanations sufficient, examples relevant and logical? Do NOT reward long essays that lack development.

COHERENCE & COHESION — paragraph organization, logical progression, topic sentences, one central idea per paragraph, cohesion, referencing, linking devices. Deduct for mechanical linking, overuse of connectors, poor sequencing, paragraphs with multiple unrelated ideas.

LEXICAL RESOURCE — range, precision, natural collocations, topic vocabulary, word formation, spelling. Deduct for repetition, incorrect collocations, wrong word choice, memorized vocabulary, informal language, spelling mistakes. Reward natural vocabulary over unnecessarily difficult words.

GRAMMATICAL RANGE & ACCURACY — sentence variety, complex-sentence control, accuracy, punctuation, articles, tenses, agreement, prepositions. Deduct for every recurring grammatical pattern. Do NOT ignore repeated grammar mistakes just because meaning is clear.

IMPORTANT: Do NOT rewrite the essay. Only evaluate it. Only use the IELTS Writing Band Descriptors. Never inflate the score.

═══════════════════════════════════════════════
OUTPUT — return ONLY valid JSON, no markdown, no commentary. Use this exact shape:
{
  "questionType": "Agree/Disagree | Discussion | Advantages/Disadvantages | Problem/Solution | Double Question",
  "estimatedWordCount": <integer>,
  "criteria": [
    {
      "code": "TR", "name": "Task Response", "band": <0-9, .5 allowed>,
      "reason": "<why this band, referencing the essay>",
      "strengths": ["..."], "weaknesses": ["..."],
      "evidence": ["<short quote or reference from the essay>"]
    },
    {
      "code": "CC", "name": "Coherence & Cohesion", "band": <0-9>,
      "reason": "...", "strengths": ["..."], "weaknesses": ["..."],
      "evidence": ["..."]
    },
    {
      "code": "LR", "name": "Lexical Resource", "band": <0-9>,
      "reason": "...", "strengths": ["..."], "weaknesses": ["..."],
      "goodVocabulary": ["..."], "vocabularyErrors": ["..."],
      "collocationErrors": ["..."], "spellingErrors": ["..."]
    },
    {
      "code": "GRA", "name": "Grammatical Range & Accuracy", "band": <0-9>,
      "reason": "...", "strengths": ["..."], "weaknesses": ["..."],
      "sentenceStructureErrors": ["..."], "grammarErrors": ["..."], "punctuationErrors": ["..."]
    }
  ],
  "overallExplanation": "<explain exactly why the overall band was awarded>",
  "majorErrors": ["<every important weakness that prevented a higher band>"],
  "bandImprovementAdvice": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "band9Suggestions": {
    "vocabulary": "<specific vocabulary improvements toward Band 9>",
    "grammar": "<specific grammar improvements toward Band 9>",
    "ideaDevelopment": "<specific idea-development improvements toward Band 9>",
    "organization": "<specific organization improvements toward Band 9>"
  }
}
All arrays must be present (use [] when nothing applies). Do not include an overall band number — it is computed from the four criteria server-side.`;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const internal = isInternalRequest(request);

    const auth = await verifyAuthAndCredits(authHeader, internal);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message, code: auth.code, ...(auth.extra ?? {}) }, { status: auth.status });
    }
    const { uid, unlimited } = auth;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip') ?? null;
    let userEmail: string | null = null;
    try { userEmail = (await adminAuth!.getUser(uid)).email ?? null; } catch { /* non-fatal */ }

    const { topic, essay, wordCount, targetBand } = await request.json();
    if (!topic || !essay) {
      return NextResponse.json({ error: 'Topic and essay content are required.' }, { status: 400 });
    }

    const apiKeyResult = getApiKey();
    if (!apiKeyResult) {
      console.error('[score-ielts-essay] No GOOGLE_GENAI_API_KEY_1..5 configured.');
      return NextResponse.json({ error: 'AI keys not configured on the server.' }, { status: 500 });
    }
    const { key: apiKey, label: apiKeyLabel, keyIndex: apiKeyIndex } = apiKeyResult;

    let userMessage = `IELTS Writing Task 2 question:\n${topic}\n\nStudent essay (${wordCount ?? 'unknown'} words):\n${essay}\n\nEvaluate this essay strictly using the four IELTS criteria. Return ONLY valid JSON in the required shape.`;

    if (typeof targetBand === 'number') {
      userMessage += `\n\nTARGET BAND ANALYSIS — the student is aiming for Band ${targetBand}. Add a "targetBandAnalysis" object:
{
  "achieved": false,
  "gap": 0,
  "primaryReasons": ["<why the essay does NOT yet reach Band ${targetBand}, referencing actual criterion bands>"],
  "criteriaGaps": [{"criterion": "<name>", "currentBand": <band>, "targetApprox": <band needed>, "whatToDo": "<specific action>"}],
  "studyPriority": "<single most important focus to reach Band ${targetBand}>",
  "realisticTimeline": "<honest estimate of weeks of focused practice>"
}
The "achieved" and "gap" fields are corrected server-side — focus on accurate reasons and advice.`;
    } else {
      userMessage += `\n\nNo target band set. Set "targetBandAnalysis" to null.`;
    }

    let responseText = '';
    let usedModel = '';
    const errorLog: string[] = [];

    for (const { name: model, api } of MODELS) {
      let ok = false;
      for (let attempt = 0; attempt <= MAX_MODEL_RETRIES; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: userMessage }] }],
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig: { maxOutputTokens: 32768, temperature: 0.1 },
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            let msg = `HTTP ${response.status}`;
            try { msg = JSON.parse(body)?.error?.message || msg; } catch { /* ignore */ }
            const isQuota = response.status === 429;
            if (!isQuota && isTransient(response.status, msg) && attempt < MAX_MODEL_RETRIES) {
              await sleep(1500 * (attempt + 1)); continue;
            }
            errorLog.push(`${model}: ${msg}`);
            break;
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            const reason = data.candidates?.[0]?.finishReason || 'no text';
            if (isTransient(0, reason) && attempt < MAX_MODEL_RETRIES) { await sleep(1500 * (attempt + 1)); continue; }
            errorLog.push(`${model}: empty (${reason})`);
            break;
          }

          const jsonStr = extractJson(text);
          JSON.parse(jsonStr); // validate
          responseText = jsonStr;
          usedModel = model;
          ok = true;
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (isTransient(0, msg) && attempt < MAX_MODEL_RETRIES) { await sleep(1500 * (attempt + 1)); continue; }
          errorLog.push(`${model}: ${msg}`);
          break;
        }
      }
      if (ok) break;
    }

    if (!responseText) {
      console.error('[score-ielts-essay] all models exhausted:', errorLog);
      logAiCall({ userId: uid, email: userEmail, ip, task: 'ielts-essay', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: null, success: false, isRateLimit: errorLog.some(e => /429|QUOTA/.test(e)), error: errorLog.join(' | '), timestamp: new Date() }).catch(() => {});
      return NextResponse.json({ error: 'All AI models failed to score the essay. Please try again in a moment.', details: errorLog }, { status: 502 });
    }
    logAiCall({ userId: uid, email: userEmail, ip, task: 'ielts-essay', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: usedModel, success: true, isRateLimit: false, error: null, timestamp: new Date() }).catch(() => {});

    const parsed = JSON.parse(responseText);

    // Recompute the overall band from the four criteria server-side, so the
    // model cannot inflate the headline number. Clamp each to 0–9.
    if (Array.isArray(parsed.criteria) && parsed.criteria.length) {
      const bands = parsed.criteria.map((c: { band: number }) => Number(c.band) || 0);
      const overall = ieltsOverallBand(bands);
      parsed.overallBand = overall;
      parsed.bandLabel = ieltsBandLabel(overall);
      if (typeof targetBand === 'number' && parsed.targetBandAnalysis) {
        parsed.targetBandAnalysis.achieved = overall >= targetBand;
        parsed.targetBandAnalysis.gap = Math.max(0, Math.round((targetBand - overall) * 2) / 2);
      }
    } else {
      return NextResponse.json({ error: 'The AI returned an incomplete evaluation. Please try again.' }, { status: 502 });
    }

    // Must be awaited — serverless kills fire-and-forget promises after the response.
    if (!unlimited) await deductIeltsCredit(uid);

    return NextResponse.json({ ...parsed, _metadata: { modelUsed: usedModel } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-ielts-essay] internal error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${message}` }, { status: 500 });
  }
}
