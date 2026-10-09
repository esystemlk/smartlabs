import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { logAiCall } from '@/lib/services/ai-usage.service';
import { isInternalRequest } from '@/lib/internal-auth';
import { ieltsOverallBand, ieltsBandLabel } from '@/types/ielts-essay';
import { hasCreditFor, deductionFor, type PoolConfig } from '@/lib/services/ai-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── Retry / model infra (mirrors the IELTS Task 2 essay scorer) ─────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const MAX_MODEL_RETRIES = 2;

const isTransient = (status: number, msg: string) =>
  status === 500 || status === 502 || status === 503 || status === 504 ||
  /overload|high demand|timeout|internal|unavailable/i.test(msg);

// Task 1 is image-based, so every model must be multimodal.
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

// ─── Credit gate — shares the IELTS pool with the Task 2 essay scorer ─────────
const FREE_IELTS_ESSAY_LIMIT = 2;
const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const IELTS_POOL: PoolConfig = { paid: 'ieltsEssayPaidCredits', monthly: 'ieltsEssayMonthlyExpiry', free: 'ieltsEssayFreeUsed', freeLimit: FREE_IELTS_ESSAY_LIMIT };

type AuthResult =
  | { ok: false; status: number; code: string; message: string; extra?: Record<string, unknown> }
  | { ok: true; uid: string; unlimited: boolean };

async function verifyAuthAndCredits(authHeader: string | null, internal: boolean): Promise<AuthResult> {
  if (!adminAuth || !adminDb) {
    return { ok: false, status: 500, code: 'NO_SERVER', message: 'Server not configured.' };
  }
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, code: 'UNAUTHENTICATED', message: 'Please sign in to score your response.' };
  }
  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return { ok: false, status: 401, code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' };
  }

  if (internal) return { ok: true, uid, unlimited: true };

  const snap = await adminDb.collection('users').doc(uid).get();
  const data = snap.data() ?? {};
  if (UNLIMITED_ROLES.has(data.role as string)) return { ok: true, uid, unlimited: true };

  if (!hasCreditFor(data, IELTS_POOL)) {
    const freeUsed = (data.ieltsEssayFreeUsed as number) ?? 0;
    return {
      ok: false, status: 402, code: 'NO_IELTS_CREDITS',
      message: freeUsed >= 1
        ? `You have used your ${FREE_IELTS_ESSAY_LIMIT} free IELTS scorings. Purchase credits to keep practising.`
        : 'Free AI scoring is no longer available on new accounts. Please purchase credits to start scoring.',
      extra: { freeUsed, paidCredits: (data.ieltsEssayPaidCredits as number) ?? 0, universalPaidCredits: (data.universalPaidCredits as number) ?? 0 },
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
      const upd = deductionFor(data, IELTS_POOL);
      if (upd) tx.update(ref, upd);
    });
  } catch (e) {
    console.warn('[score-ielts-task1] credit deduction failed:', e);
  }
}

// ─── Examiner prompt — Smart Labs AI IELTS Academic Writing Task 1 examiner ───
// Anchored to the official IELTS Writing Task 1 Band Descriptors (updated May
// 2023). The four criteria are Task Achievement, Coherence & Cohesion, Lexical
// Resource, and Grammatical Range & Accuracy.
const SYSTEM_PROMPT = `You are the Smart Labs AI IELTS Writing Examiner, evaluating IELTS ACADEMIC Writing Task 1 responses as closely as reasonably possible to the published IELTS Writing Band Descriptors (updated May 2023). You are not an official examiner; never present your score as an official IELTS result.

The student is shown a visual (a graph, chart, table, map/plan, or process diagram) and must summarise the main features and make comparisons where relevant, in at least 150 words. You are given the IMAGE of the visual, the task prompt, and — as a marking anchor — a list of the correct KEY FEATURES the visual actually shows. Use the image and the key features to judge whether the student reported the data ACCURATELY.

Assess ONLY these four official criteria, each 0–9 with HALF bands allowed:
1. Task Achievement (TA)
2. Coherence & Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range & Accuracy (GRA)

TASK ACHIEVEMENT — the single most important Task 1 criterion. Check that the response:
- presents a CLEAR OVERVIEW of the main trends, differences or stages (an answer with no overview is capped at Band 5 for TA);
- selects and clearly highlights the KEY FEATURES;
- reports the data/stages ACCURATELY against the key features provided (penalise wrong figures, invented data, or misread trends);
- uses an appropriate format and stays on task (no opinions, no reasons/causes that are not shown — for a process, describe the stages in order);
- meets the 150-word minimum (penalise under-length, and penalise bare mechanical recounting with no grouping or comparison).

COHERENCE & COHESION — logical organisation, clear progression, paragraphing (intro/overview/body), and controlled use of cohesive devices and referencing. Deduct for mechanical or faulty linking and poor sequencing.

LEXICAL RESOURCE — range and accuracy of vocabulary for describing data/trends/processes (e.g. rose, declined, levelled off, the majority, respectively), collocation, word formation and spelling. Deduct for repetition, wrong word choice and spelling errors.

GRAMMATICAL RANGE & ACCURACY — range and control of structures (comparatives, passives for processes, time clauses), tense accuracy, articles, prepositions and punctuation. Deduct for every recurring error pattern.

MARKING PRINCIPLES
- Be objective and conservative. If uncertain between two bands, award the LOWER band unless there is clear evidence for the higher one.
- Never inflate. Justify every band with evidence from the response.
- Do NOT rewrite the response. Do NOT reward memorised sentences used unnaturally.

═══════════════════════════════════════════════
OUTPUT — return ONLY valid JSON, no markdown, no commentary, in this EXACT shape:
{
  "questionType": "<e.g. Line graph | Bar chart | Pie chart | Table | Map/Plan | Process diagram | Mixed>",
  "estimatedWordCount": <integer>,
  "criteria": [
    { "code": "TA", "name": "Task Achievement", "band": <0-9>, "reason": "<why, referencing the data accuracy and overview>", "strengths": ["..."], "weaknesses": ["..."], "evidence": ["<short quote/reference from the response>"] },
    { "code": "CC", "name": "Coherence & Cohesion", "band": <0-9>, "reason": "...", "strengths": ["..."], "weaknesses": ["..."], "evidence": ["..."] },
    { "code": "LR", "name": "Lexical Resource", "band": <0-9>, "reason": "...", "strengths": ["..."], "weaknesses": ["..."], "goodVocabulary": ["..."], "vocabularyErrors": ["..."], "collocationErrors": ["..."], "spellingErrors": ["..."] },
    { "code": "GRA", "name": "Grammatical Range & Accuracy", "band": <0-9>, "reason": "...", "strengths": ["..."], "weaknesses": ["..."], "sentenceStructureErrors": ["..."], "grammarErrors": ["..."], "punctuationErrors": ["..."] }
  ],
  "overallExplanation": "<why the overall band was awarded>",
  "majorErrors": ["<every important weakness that prevented a higher band>"],
  "bandImprovementAdvice": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "band9Suggestions": {
    "vocabulary": "<specific vocabulary improvements toward Band 9>",
    "grammar": "<specific grammar improvements toward Band 9>",
    "ideaDevelopment": "<specific overview/data-selection improvements toward Band 9>",
    "organization": "<specific organisation improvements toward Band 9>"
  }
}
All arrays must be present (use [] when nothing applies). Do NOT include an overall band number — it is computed from the four criteria server-side.`;

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB of base64-decoded image

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

    const { prompt, response: answer, wordCount, visualType, keyFeatures, imageBase64, imageMime, targetBand } = await request.json();
    if (!prompt || !answer) {
      return NextResponse.json({ error: 'Task prompt and your response are required.' }, { status: 400 });
    }
    // Keep the base64 payload sane. ~4/3 expansion for base64.
    if (typeof imageBase64 === 'string' && imageBase64.length > MAX_IMAGE_BYTES * 1.4) {
      return NextResponse.json({ error: 'The task image is too large to score.' }, { status: 413 });
    }

    const apiKeyResult = getApiKey();
    if (!apiKeyResult) {
      console.error('[score-ielts-task1] No GOOGLE_GENAI_API_KEY_1..5 configured.');
      return NextResponse.json({ error: 'AI keys not configured on the server.' }, { status: 500 });
    }
    const { key: apiKey, label: apiKeyLabel, keyIndex: apiKeyIndex } = apiKeyResult;

    let userMessage = `IELTS Academic Writing Task 1 prompt:\n${prompt}\n`;
    if (visualType) userMessage += `\nVisual type: ${visualType}`;
    if (keyFeatures) {
      userMessage += `\n\nKEY FEATURES the visual actually shows (marking anchor — judge the student's accuracy against these):\n${keyFeatures}`;
    }
    userMessage += `\n\nStudent response (${wordCount ?? 'unknown'} words):\n${answer}\n\nStudy the attached image and evaluate this response strictly using the four IELTS Task 1 criteria. Return ONLY valid JSON in the required shape.`;

    if (typeof targetBand === 'number') {
      userMessage += `\n\nTARGET BAND ANALYSIS — the student is aiming for Band ${targetBand}. Add a "targetBandAnalysis" object:
{
  "achieved": false,
  "gap": 0,
  "primaryReasons": ["<why the response does NOT yet reach Band ${targetBand}, referencing actual criterion bands>"],
  "criteriaGaps": [{"criterion": "<name>", "currentBand": <band>, "targetApprox": <band needed>, "whatToDo": "<specific action>"}],
  "studyPriority": "<single most important focus to reach Band ${targetBand}>",
  "realisticTimeline": "<honest estimate of weeks of focused practice>"
}
The "achieved" and "gap" fields are corrected server-side — focus on accurate reasons and advice.`;
    } else {
      userMessage += `\n\nNo target band set. Set "targetBandAnalysis" to null.`;
    }

    // Build the multimodal parts: text + (optional) the task image.
    const parts: Array<Record<string, unknown>> = [{ text: userMessage }];
    if (typeof imageBase64 === 'string' && imageBase64.length > 0) {
      parts.push({ inlineData: { mimeType: imageMime || 'image/png', data: imageBase64 } });
    }

    let responseText = '';
    let usedModel = '';
    const errorLog: string[] = [];

    for (const { name: model, api } of MODELS) {
      let ok = false;
      for (let attempt = 0; attempt <= MAX_MODEL_RETRIES; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig: { maxOutputTokens: 32768, temperature: 0.1 },
            }),
          });

          if (!res.ok) {
            const body = await res.text();
            let msg = `HTTP ${res.status}`;
            try { msg = JSON.parse(body)?.error?.message || msg; } catch { /* ignore */ }
            const isQuota = res.status === 429;
            if (!isQuota && isTransient(res.status, msg) && attempt < MAX_MODEL_RETRIES) {
              await sleep(1500 * (attempt + 1)); continue;
            }
            errorLog.push(`${model}: ${msg}`);
            break;
          }

          const data = await res.json();
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
      console.error('[score-ielts-task1] all models exhausted:', errorLog);
      logAiCall({ userId: uid, email: userEmail, ip, task: 'ielts-task1', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: null, success: false, isRateLimit: errorLog.some(e => /429|QUOTA/.test(e)), error: errorLog.join(' | '), timestamp: new Date() }).catch(() => {});
      return NextResponse.json({ error: 'All AI models failed to score the response. Please try again in a moment.', details: errorLog }, { status: 502 });
    }
    logAiCall({ userId: uid, email: userEmail, ip, task: 'ielts-task1', keyLabel: apiKeyLabel, keyIndex: apiKeyIndex, model: usedModel, success: true, isRateLimit: false, error: null, timestamp: new Date() }).catch(() => {});

    const parsed = JSON.parse(responseText);

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

    if (!unlimited) await deductIeltsCredit(uid);

    return NextResponse.json({ ...parsed, _metadata: { modelUsed: usedModel } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-ielts-task1] internal error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${message}` }, { status: 500 });
  }
}
