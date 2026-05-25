import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// ─── Model list (priority order) ─────────────────────────────────────────────
const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
  { name: 'gemini-3.1-pro',   api: 'v1beta' },
];

// ─── In-memory API key cache (refreshes every 2 min or on cache_control signal) ─
let _cachedKey: string | null = null;
let _cacheExpiry  = 0;
let _cacheVersion = 0;        // mirrors Firestore cache_control.keyVersion

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function getApiKey(): Promise<string | null> {
  try {
    if (adminDb) {
      // Check if admin has invalidated the cache
      const ccSnap = await adminDb.collection('system_config').doc('cache_control').get();
      const remoteVersion: number = ccSnap.exists ? (ccSnap.data()?.keyVersion ?? 0) : 0;

      const cacheStillValid =
        _cachedKey &&
        Date.now() < _cacheExpiry &&
        _cacheVersion === remoteVersion;

      if (!cacheStillValid) {
        // Fetch from Firestore
        const snap = await adminDb.collection('system_config').doc('ai_settings').get();
        if (snap.exists) {
          const key = snap.data()?.geminiApiKey as string | undefined;
          if (key) {
            _cachedKey    = key;
            _cacheExpiry  = Date.now() + CACHE_TTL_MS;
            _cacheVersion = remoteVersion;
            console.log('[score-essay] API key loaded from Firestore.');
            return key;
          }
        }
      } else {
        return _cachedKey;
      }
    }
  } catch (e) {
    console.warn('[score-essay] Firestore key read failed, falling back to .env:', e);
  }

  // Fall back to environment variables
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || null;
}

// ─── Fire-and-forget usage tracking ──────────────────────────────────────────
async function trackModelUsage(
  model   : string,
  success : boolean,
  errorMsg?: string
) {
  try {
    if (!adminDb) return;
    const ref = adminDb.collection('system_config').doc('model_usage');

    // Build the nested update using dot-notation keys (Firestore merges safely)
    const updates: Record<string, unknown> = {
      totalRequests                                 : adminDb.collection('system_config').doc('model_usage') as unknown, // placeholder; overridden below
      [`models.${model}.lastUsedAt`]               : new Date(),
      [`models.${model}.lastStatus`]                : success ? 'active' : 'exhausted',
    };
    // We can't use FieldValue without importing from firebase-admin/firestore.
    // Use a transaction-free increment pattern: read + write (acceptable for low traffic).
    const snap = await ref.get();
    const data = snap.data() ?? {};
    const models: Record<string, Record<string, unknown>> = (data.models as Record<string, Record<string, unknown>>) ?? {};
    const m     = (models[model] ?? {}) as Record<string, unknown>;

    const patch: Record<string, unknown> = {
      totalRequests: ((data.totalRequests as number) ?? 0) + 1,
      [`models.${model}.successCount`]: ((m.successCount as number) ?? 0) + (success ? 1 : 0),
      [`models.${model}.failureCount`]: ((m.failureCount as number) ?? 0) + (success ? 0 : 1),
      [`models.${model}.lastUsedAt`]  : new Date(),
      [`models.${model}.lastStatus`]  : success ? 'active' : 'exhausted',
    };
    if (!success && errorMsg) {
      patch[`models.${model}.lastError`] = errorMsg;
    }

    // Use update() with dot-notation — Firestore does not allow dots in set() keys,
    // but update() with strings is fine.
    try {
      await ref.update(patch);
    } catch {
      // Document didn't exist yet — create it
      await ref.set({
        totalRequests: 1,
        models: {
          [model]: {
            successCount: success ? 1 : 0,
            failureCount: success ? 0 : 1,
            lastUsedAt  : new Date(),
            lastStatus  : success ? 'active' : 'exhausted',
            lastError   : !success && errorMsg ? errorMsg : '',
          },
        },
      });
    }
  } catch (e) {
    console.warn('[score-essay] Usage tracking failed (non-blocking):', e);
  }
}

// ─── Prompt ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert PTE Academic Essay evaluator trained on the official Pearson PTE Academic August 2025 scoring scheme. Evaluate student essays critically and precisely. Students depend on accurate scores to guide their study — do not inflate.

═══ OFFICIAL PTE WRITE ESSAY CRITERIA (August 2025) ═══

1. Content (0–6)  ← GATE CRITERION
   Does the essay address the topic? Is the thesis clear and fully developed with relevant arguments?
   6: Fully addresses all aspects; thesis well-developed with logical, relevant arguments throughout
   4–5: Mostly on-topic; thesis present but some points underdeveloped
   2–3: Partially addresses topic; thesis vague or arguments shallow
   0–1: Off-topic, irrelevant, or contains memorised / pre-prepared material
   ⚠️ GATE RULE 1: If Content = 0, score ALL other criteria as 0. Do not evaluate anything further.

2. Form (0–2)
   Word count within 200–300 AND exactly 4 paragraphs?
   2: 200–300 words, exactly 4 paragraphs (Introduction / Body 1 / Body 2 / Conclusion)
   1: Slightly outside range (180–199 or 301–350 words) OR missing one structural element
   0: Below 180 or above 350 words, OR completely wrong paragraph count (1, 2, or 5+ paragraphs)
   ⚠️ GATE RULE 2: If Form = 0, score DSC, GLR, Vocabulary, Grammar, and Spelling as 0.

3. Development, Structure & Coherence — DSC (0–6)  ← Human-reviewed in real PTE
   Logical progression of arguments, paragraph unity, cohesion of ideas, transition quality
   6: Perfect logical flow; each paragraph proves ONE idea; excellent natural transitions; thesis proven throughout
   4–5: Good structure with minor flow issues; mostly one idea per paragraph; transitions adequate
   2–3: Loosely connected points; paragraphs mix ideas; transitions mechanical or repetitive; thesis inconsistent
   0–1: No discernible structure; ideas scattered; no logical progression whatsoever
   ⚠️ THRESHOLD: DSC must be ≥ 5 to enable overall bands of 70+. Two paragraphs of loosely connected points = DSC 3, regardless of vocabulary strength. DSC is human-reviewed and cannot be gamed with memorised phrases.

4. General Linguistic Range — GLR (0–6)  ← Human-reviewed in real PTE
   Variety and control of sentence structures; ability to express complex ideas through varied syntax
   6: Excellent mix of simple, compound, and complex sentences; all structures fully controlled; no awkward constructions
   4–5: Good variety with occasional awkward phrasing; mostly controlled syntax and grammar
   2–3: Limited variety; repetitive sentence patterns; some structures unclear or poorly constructed
   0–1: Mostly simple sentences; frequent structural breakdown; very limited expressive range

5. Vocabulary (0–2)  ← Enabling skill
   Appropriateness, naturalness, precision of word choice; collocations; avoidance of memorised phrases
   2: Varied, natural, academic vocabulary; strong collocations; zero robotic template language
   1: Some good vocabulary but repetitive or slightly unnatural usage
   0: Very basic, heavily repetitive, or memorised / template-heavy vocabulary

6. Grammar (0–2)  ← Enabling skill
   Sentence-level grammatical accuracy
   2: Very few or no grammatical errors; controlled structures
   1: Some errors present but meaning is not impeded
   0: Frequent errors that impede understanding

7. Spelling (0–2)  ← Enabling skill
   2: Minimal or no spelling errors
   1: Some spelling errors but not distracting
   0: Frequent spelling errors that impede readability

═══ SCORE PRIORITY ═══
Content → DSC → GLR are the three primary score drivers (DSC and GLR are human-reviewed in real PTE — they cannot be faked).
Vocabulary, Grammar, Spelling, Form are enabling skills — important for reaching maximum but not the key differentiators between bands.

═══ REALISTIC SCORING CALIBRATION — be strict, not generous ═══
• Content 5-6 + DSC 5-6 + GLR 5-6 + clean enabling skills → Band 80–90
• Content 4-5 + DSC 4-5 + GLR 4-5 + solid enabling skills → Band 65–79
• Content 3-4 + DSC 3-4 + GLR 3 + average enabling skills → Band 50–65
• Content 2-3 + DSC ≤ 2 + weak GLR → Band 30–50
• DSC ≤ 3 (loosely connected points, weak structure) → overall band capped ~55 even with strong vocabulary
• Do NOT inflate. A mediocre essay with decent vocabulary is NOT a Band 65 essay.

═══ STRUCTURE RULES (apply strictly) ═══
• Exactly 4 paragraphs: Introduction, Body Paragraph 1, Body Paragraph 2, Conclusion
• Introduction: exactly 2 sentences (background sentence + thesis statement)
• Body 1 & Body 2: ~5 sentences each, exactly ONE central idea per paragraph
• Conclusion: exactly 1 sentence (restates thesis — introduces NO new ideas)
• Ideal word count: 220–250. Penalise significantly below 200 or above 300.

═══ COHERENCE & COHESION RULES ═══
• Each paragraph must discuss ONLY ONE central idea
• ALL supporting sentences must prove or explain that one central topic
• Identify paragraph unity violations explicitly
• Topic sentences must clearly guide the paragraph direction
• Transitions must be natural and varied — not forced or repetitive

═══ THESIS STATEMENT RULES ═══
• Thesis stated in introduction MUST be proven throughout the essay
• Body paragraphs must directly support the thesis
• Conclusion must restate the thesis — no new ideas
• If arguments drift from the thesis, reduce Content and DSC scores

═══ VOCABULARY & COLLOCATION RULES ═══
• Do NOT reward robotic or memorised vocabulary — penalise it explicitly
• Reward natural academic vocabulary that fits context
• Strong collocations: technological advancement, global economy, social responsibility, environmental protection, mental health issues, practical experience, academic performance, critical thinking, sustainable development, long-term consequences, fundamental right
• Evaluate each collocation: natural / forced / incorrect
• Flag template phrases (e.g. "In today's fast-paced world", "It goes without saying", "First and foremost")

═══ ARGUMENTATIVE QUALITY RULES ═══
• Arguments must be explained with clear cause-and-effect reasoning — not just stated
• Each claim needs explanation and support — avoid shallow listing of ideas
• Strong reasoning matters more than impressive vocabulary

═══ GRAMMAR RULES ═══
• Check sentence variety — penalise all-same-pattern writing
• Identify specific grammar errors with exact corrections
• Note punctuation mistakes separately (comma splices, missing commas, etc.)
• Reward clear and controlled grammatical structures

Return ONLY valid JSON (no markdown, no text outside the JSON object). The overallBand and bandLabel fields will be recalculated server-side — set them to 0 and empty string:
{
  "overallBand": 0,
  "bandLabel": "",
  "summaryTitle": "<brief honest title reflecting actual quality>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "criteria": [
    {"name":"Content","score":<0-6>,"max":6,"color":"#8b5cf6","comment":"<1-2 sentence comment>"},
    {"name":"Form","score":<0-2>,"max":2,"color":"#2563eb","comment":"<1-2 sentence comment>"},
    {"name":"Development, Structure & Coherence","score":<0-6>,"max":6,"color":"#10b981","comment":"<1-2 sentence comment — note DSC threshold if score ≤ 3>"},
    {"name":"General Linguistic Range","score":<0-6>,"max":6,"color":"#f59e0b","comment":"<1-2 sentence comment>"},
    {"name":"Vocabulary","score":<0-2>,"max":2,"color":"#ec4899","comment":"<1-2 sentence comment>"},
    {"name":"Grammar","score":<0-2>,"max":2,"color":"#ef4444","comment":"<1-2 sentence comment>"},
    {"name":"Spelling","score":<0-2>,"max":2,"color":"#6366f1","comment":"<1-2 sentence comment>"}
  ],
  "contentAnalysis": {
    "score": <0-6>,
    "reason": "<2-3 sentences: did the essay fully answer the question? was the thesis properly developed and maintained throughout?>"
  },
  "structureDetail": {
    "paragraphCount": <number>,
    "paragraphCountCorrect": <boolean — true only if exactly 4 paragraphs>,
    "introduction": "<analysis: exact sentence count, quality of background + thesis statement, what works or is missing>",
    "bodyParagraph1": "<analysis: sentence count, what is the central idea, does the paragraph stay on ONE idea or drift?>",
    "bodyParagraph2": "<analysis: sentence count, what is the central idea, does the paragraph stay on ONE idea or drift?>",
    "conclusion": "<analysis: does it restate the thesis? does it avoid new ideas? sentence count>",
    "overallBalance": "<is word and content distribution between paragraphs balanced and effective?>",
    "followsIdealStrategy": <boolean>
  },
  "coherenceAnalysis": {
    "oneIdeaPerParagraph": <boolean>,
    "logicalFlow": "<analysis of logical progression between sentences — do ideas build on each other?>",
    "paragraphUnity": "<analysis of whether each paragraph maintains a single central topic>",
    "sentenceConnection": "<how well individual sentences connect to and build upon each other>",
    "transitionQuality": "<are linking words natural, varied, and well-placed — or repetitive and forced?>",
    "breakPoints": ["<exact description of where coherence breaks, e.g. Body Paragraph 1 shifts mid-paragraph from discussing X to Y without connection>"]
  },
  "thesisDevelopment": {
    "clarityOfThesis": "<how clearly and specifically the thesis is stated in the introduction>",
    "consistencyOfArguments": "<whether the body paragraph arguments remain consistent with the thesis>",
    "bodySupportsThesis": <boolean>,
    "conclusionProvesThesis": <boolean>,
    "overallAnalysis": "<2 sentences: overall assessment of how well the thesis is developed from introduction to conclusion>"
  },
  "argumentativeQuality": {
    "explanationDepth": "<are arguments explained deeply with reasoning and cause-effect logic — or just stated as facts?>",
    "logicQuality": "<is each claim logically supported? are there logical gaps or unsupported jumps?>",
    "exampleSupport": "<how effectively examples are used to support the main points>",
    "relevanceOfIdeas": "<do all ideas stay clearly relevant to the topic and thesis — or do some drift off-topic?>",
    "criticalThinking": "<does the writer demonstrate critical thinking beyond surface-level observations?>",
    "weakArguments": ["<quote or closely paraphrase a specific weak or undeveloped argument from the essay>"],
    "howToImprove": ["<specific actionable instruction to strengthen the corresponding weak argument>"]
  },
  "vocabularyCollocations": {
    "strongVocabulary": ["<strong natural academic word or phrase used effectively>"],
    "collocationsUsed": [{"collocation": "<exact collocation found in essay>", "evaluation": "<natural / forced / incorrect>"}],
    "repetitiveVocabulary": ["<word or phrase that appears too many times in the essay>"],
    "awkwardPhrases": ["<unnatural or awkward phrase found in essay>"],
    "memorizedLanguage": ["<phrase that sounds memorized, template-based, or robotic>"]
  },
  "grammarAnalysis": {
    "mistakes": [{"original": "<exact sentence from the essay containing the error>", "corrected": "<fully corrected version of that sentence>", "explanation": "<brief explanation of the specific error>"}],
    "punctuationMistakes": ["<specific punctuation issue with example>"],
    "awkwardSentences": ["<exact sentence that is grammatically correct but sounds unnatural or unnecessarily complex>"],
    "sentenceVariety": "<analysis: does the writer use varied sentence structures (simple, compound, complex)? or are patterns repetitive?>"
  },
  "improvementPlan": {
    "top5Weaknesses": ["<most critical weakness>", "<weakness 2>", "<weakness 3>", "<weakness 4>", "<weakness 5>"],
    "sentenceCorrections": [
      {"original": "<exact original sentence that needs improvement>", "improved": "<significantly improved, natural-sounding version>"}
    ],
    "strategicTips": ["<specific actionable tip to quickly increase PTE Writing score>", "<tip 2>", "<tip 3>"]
  },
  "wouldScore79Plus": {
    "answer": <boolean — honest realistic assessment>,
    "explanation": "<2-3 sentences of realistic honest explanation based on actual PTE Academic scoring standards — do not sugarcoat>"
  },
  "strengths": ["<genuine specific strength 1>", "<genuine specific strength 2>", "<genuine specific strength 3>"],
  "improvements": ["<critical improvement area 1>", "<critical improvement area 2>", "<critical improvement area 3>"],
  "modelEssay": "<band 85+ model essay if requested — 220-250 words, exactly 4 paragraphs, natural collocations, varied sentence structures — empty string if not requested>",
  "reviewedEssayHtml": "<the exact student essay with errors marked using HTML — wrap each error in <span style='border-bottom:2px solid #ef4444;cursor:help' title='Suggestion: [correction]'>wrong text</span> — keep all other text plain, preserve line breaks>",
  "vocabUpgrades": [{"basic": "<basic word actually used in essay>", "better": "<more natural or precise academic alternative>"}],
  "actionableFeedback": [{"issue": "<specific identifiable problem in the essay>", "howToFix": "<concrete specific solution>"}],
  "targetScoreAnalysis": null
}`;

// ─── Band calculator (server-side, prevents AI score inflation) ──────────────
function calculateBandFromCriteria(criteria: Array<{ score: number; max: number }>): number {
  const totalScore = criteria.reduce((sum, c) => sum + (c.score || 0), 0);
  const maxScore   = criteria.reduce((sum, c) => sum + (c.max   || 0), 0) || 26;
  return Math.round((totalScore / maxScore) * 90);
}

function getBandLabel(band: number): string {
  if (band >= 85) return 'Expert';
  if (band >= 79) return 'Advanced';
  if (band >= 65) return 'Upper Intermediate';
  if (band >= 50) return 'Intermediate';
  if (band >= 30) return 'Developing';
  return 'Beginner';
}

// ─── JSON extractor ───────────────────────────────────────────────────────────
function extractJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned.trim();
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { topic, essay, wordCount, requestModelEssay, targetScore } = await request.json();

    if (!topic || !essay) {
      return NextResponse.json(
        { error: 'Topic and essay content are required.' },
        { status: 400 }
      );
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      console.error('Server Configuration Error: Gemini API key is missing from both Firestore and .env.');
      return NextResponse.json(
        { error: 'Gemini API key is not configured on the server.' },
        { status: 500 }
      );
    }

    let userMessage = `Essay Topic: ${topic}

Student Essay (${wordCount} words):
${essay}

Now evaluate this essay carefully following all the scoring rules. Be critical, strategic, and realistic in your assessment. Return only valid JSON with no extra text.`;

    if (requestModelEssay) {
      userMessage += `\n\nAlso include a Band 85+ model essay (220-250 words, exactly 4 paragraphs: 2-sentence intro, ~5-sentence body 1, ~5-sentence body 2, 1-sentence conclusion) with natural collocations and varied sentence structures in the 'modelEssay' field.`;
    } else {
      userMessage += `\n\nLeave the 'modelEssay' field as an empty string.`;
    }

    if (targetScore && typeof targetScore === 'number') {
      userMessage += `\n\nTARGET SCORE ANALYSIS:
The student's target PTE Writing band is: Band ${targetScore}.
In the "targetScoreAnalysis" field, provide this object:
{
  "achieved": false,
  "gap": 0,
  "primaryReasons": ["<specific reason why the essay does NOT yet reach Band ${targetScore} — refer to actual criteria scores>"],
  "criteriaGaps": [{"criterion": "<criterion name>", "currentScore": <actual score>, "targetApprox": <score needed to reach Band ${targetScore}>, "whatToDo": "<specific actionable improvement>"}],
  "studyPriority": "<single most important thing to focus on to reach Band ${targetScore}>",
  "realisticTimeline": "<honest, realistic estimate of how many weeks of focused practice are needed to reach Band ${targetScore}>"
}
Note: Only list criteria in criteriaGaps that are actually below the required threshold for Band ${targetScore}. The "achieved" and "gap" fields will be corrected server-side — focus on accurate reasons and advice.`;
    } else {
      userMessage += `\n\nNo target score set. Set "targetScoreAnalysis" to null in your JSON response.`;
    }

    let responseText = '';
    let usedModel    = '';
    const errorLog: string[] = [];

    for (const { name: model, api } of MODELS) {
      try {
        console.log(`[score-essay] Trying model: ${model} (${api})`);
        const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            contents         : [{ role: 'user', parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig : { maxOutputTokens: 8192, temperature: 0.1 },
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let msg = `HTTP ${response.status}`;
          try { msg = JSON.parse(errorBody)?.error?.message || msg; } catch { /* ignore */ }
          const errorCode = response.status === 429 ? 'QUOTA_EXCEEDED' : `HTTP_${response.status}`;
          errorLog.push(`${model}: ${msg}`);
          console.warn(`[score-essay] ${model}: ${msg}`);
          trackModelUsage(model, false, errorCode).catch(() => {});
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          const reason = data.candidates?.[0]?.finishReason || 'no text returned';
          errorLog.push(`${model}: empty response (${reason})`);
          console.warn(`[score-essay] ${model}: empty response — ${reason}`);
          trackModelUsage(model, false, `EMPTY_${reason}`).catch(() => {});
          continue;
        }

        const jsonStr = extractJson(text);
        JSON.parse(jsonStr); // validate
        responseText = jsonStr;
        usedModel    = model;
        console.log(`[score-essay] ✓ Success with model: ${model}`);
        trackModelUsage(model, true).catch(() => {});
        break;

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errorLog.push(`${model}: ${msg}`);
        console.warn(`[score-essay] ${model} threw:`, msg);
        trackModelUsage(model, false, 'EXCEPTION').catch(() => {});
      }
    }

    if (!responseText) {
      console.error('[score-essay] All models exhausted:', errorLog);
      return NextResponse.json(
        {
          error  : 'All AI models failed to score the essay. Please try again in a moment.',
          details: errorLog,
        },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(responseText);

    // Apply official PTE August 2025 gate rules, then calculate band from criteria
    if (parsed.criteria && Array.isArray(parsed.criteria)) {
      const contentC = parsed.criteria.find((c: { name: string }) => c.name === 'Content');
      const formC    = parsed.criteria.find((c: { name: string }) => c.name === 'Form');

      if (contentC?.score === 0) {
        // Gate 1: Content = 0 → all criteria = 0
        parsed.criteria = parsed.criteria.map((c: { score: number }) => ({ ...c, score: 0 }));
      } else if (formC?.score === 0) {
        // Gate 2: Form = 0 → DSC, GLR, Vocabulary, Grammar, Spelling = 0
        const gated = new Set(['Development, Structure & Coherence', 'General Linguistic Range', 'Vocabulary', 'Grammar', 'Spelling']);
        parsed.criteria = parsed.criteria.map((c: { name: string; score: number }) =>
          gated.has(c.name) ? { ...c, score: 0 } : c
        );
      }

      const calculatedBand = calculateBandFromCriteria(parsed.criteria);
      parsed.overallBand   = calculatedBand;
      parsed.bandLabel     = getBandLabel(calculatedBand);

      // Override targetScoreAnalysis achieved/gap with server-calculated values
      if (targetScore && typeof targetScore === 'number' && parsed.targetScoreAnalysis) {
        parsed.targetScoreAnalysis.achieved = calculatedBand >= targetScore;
        parsed.targetScoreAnalysis.gap      = Math.max(0, targetScore - calculatedBand);
      }
    }

    return NextResponse.json({
      ...parsed,
      _metadata: { modelUsed: usedModel },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-essay] Internal error:', error);
    return NextResponse.json(
      { error: `Internal Server Error: ${message}` },
      { status: 500 }
    );
  }
}
