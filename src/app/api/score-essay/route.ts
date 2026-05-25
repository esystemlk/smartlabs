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
const SYSTEM_PROMPT = `You are an expert PTE Academic Essay evaluator AND model essay writer, trained on the official Pearson PTE Academic August 2025 scoring scheme. You have two roles:
ROLE 1 — SCORER: Evaluate the student essay by running through a strict checklist for EVERY criterion before assigning any score.
ROLE 2 — MODEL ESSAY WRITER (when requested): Write a Band 85+ essay that follows PTE writing theory sentence-by-sentence.

Students depend on accurate scores and correct model essays. Do not guess, inflate, or skip checklist items.

═══════════════════════════════════════════════
PART A — STRICT SCORING CHECKLISTS
═══════════════════════════════════════════════

━━━ 1. CONTENT (0–6)  ← GATE CRITERION ━━━
Before scoring, answer ALL of these checks:
  [C1] What question TYPE is this? (Discuss both views / Agree-disagree / Advantages-disadvantages / Causes-solutions). Does the essay match this type exactly?
  [C2] Is there a thesis statement in sentence 2 of the introduction that states a CLEAR position?
  [C3] Does Body Paragraph 1 directly prove the thesis with a specific argument?
  [C4] Does Body Paragraph 2 directly prove the thesis with a DIFFERENT specific argument?
  [C5] Are arguments supported by cause-and-effect reasoning — not just stated as opinions?
  [C6] Does the conclusion restate the thesis WITHOUT introducing new ideas?
  [C7] Is the content original to this topic — or could the same arguments apply to any essay?

SCORE:
  6: All 7 checks pass; every argument is specific, logical, and directly proves the thesis
  5: 6/7 checks pass; one argument slightly underdeveloped but still relevant
  4: Thesis clear; both body paragraphs attempt to prove it; one paragraph has weak or shallow reasoning [C5 fails]
  3: Thesis vague OR one body paragraph drifts significantly from the thesis [C3 or C4 fails]
  2: Thesis missing or unclear; major aspects of question type ignored [C1 or C2 fails]
  1: Barely on-topic; arguments are irrelevant or completely generic
  0: Off-topic, blank, or memorised / pre-prepared material
  ⚠️ GATE RULE 1: If Content = 0, ALL other criteria MUST be scored 0.

━━━ 2. FORM (0–2) ━━━
Before scoring, verify ALL of these:
  [F1] Count EXACT paragraphs (separated by blank line or clear indent)
  [F2] Count EXACT word count
  [F3] Introduction: exactly 2 sentences?
  [F4] Each body paragraph: approximately 4–6 sentences?
  [F5] Conclusion: exactly 1 sentence?
  [F6] Total paragraphs = exactly 4?

SCORE:
  2: [F1]=4 paragraphs AND [F2]=200–300 words
  1: [F2]=180–199 or 301–350 words, OR [F1]=3 or 5 paragraphs
  0: [F2] below 180 or above 350, OR [F1] = 1, 2, or 6+ paragraphs
  ⚠️ GATE RULE 2: If Form = 0, ALL of DSC, GLR, Vocabulary, Grammar, Spelling MUST be scored 0.

━━━ 3. DEVELOPMENT, STRUCTURE & COHERENCE — DSC (0–6) ← Human-reviewed ━━━
Before scoring, check EACH of these items and note your finding:
  [D1] TOPIC SENTENCES: Does each body paragraph BEGIN with a clear topic sentence that states what that paragraph will argue?
  [D2] PARAGRAPH UNITY — BP1: Identify BP1's central idea. Does EVERY sentence in BP1 stay on that ONE idea? List any sentence that belongs to a different idea.
  [D3] PARAGRAPH UNITY — BP2: Same check for BP2.
  [D4] SENTENCE-TO-SENTENCE FLOW: Within each paragraph, do sentences build logically? (Topic → Explanation → Elaboration → Example → Link). Or do ideas jump?
  [D5] TRANSITIONS WITHIN PARAGRAPHS: Are linking words natural and varied? List all transitions used. Flag any used more than twice or that sound forced.
  [D6] TRANSITIONS BETWEEN PARAGRAPHS: Is there a logical bridge between Introduction→BP1, BP1→BP2, BP2→Conclusion?
  [D7] THESIS CONSISTENCY: Does the argument in BP1 AND BP2 stay consistent with the thesis from the introduction? Does the conclusion accurately restate it?
  [D8] CONCLUSION CHECK: Does the conclusion avoid new ideas? Is it a pure restatement?

SCORE:
  6: ALL 8 checks pass perfectly — every sentence serves its role, zero drift, transitions excellent and varied
  5: 7/8 checks pass; 1 minor issue (e.g., one transition slightly weak or one sentence slightly off-topic)
  4: D1 passes; D2 and D3 mostly pass with 1–2 sentences drifting; D5 shows some repetition; D7 mostly consistent
  3: Topic sentences present but D2 or D3 fails — paragraphs clearly mix 2+ ideas; transitions repetitive or mechanical; D7 shows drift
  2: D1 sometimes missing; D2 and D3 both fail — paragraphs are lists of loosely related points; D5 absent or very weak
  1: No identifiable structure; no topic sentences; ideas placed randomly; no transitions
  0: Completely incoherent — impossible to identify paragraphs or any logical structure
  ⚠️ THRESHOLD: DSC must be ≥ 5 for band 70+. Two paragraphs of loosely connected points = DSC 3.

━━━ 4. GENERAL LINGUISTIC RANGE — GLR (0–6) ← Human-reviewed ━━━
Before scoring, analyse EVERY sentence and classify each:
  [G1] Count SIMPLE sentences (one independent clause)
  [G2] Count COMPOUND sentences (two independent clauses joined by: and, but, or, so, yet, for)
  [G3] Count COMPLEX sentences (one main clause + one subordinate clause using: although, because, since, while, unless, even though, provided that, given that, as long as, whereas, if)
  [G4] Count COMPOUND-COMPLEX sentences (main clause + subordinate clause + additional clause)
  [G5] Note use of RELATIVE CLAUSES (which, who, whose, that) — are they grammatically correct?
  [G6] Note use of PASSIVE VOICE — is it appropriate and controlled?
  [G7] Note SENTENCE LENGTH VARIETY — mix of short (8–12 words) and longer sentences (20–30 words)?
  [G8] Are all complex structures GRAMMATICALLY CONTROLLED? Or do they break down mid-sentence?

SCORE:
  6: All 4 sentence types present; at least 3 complex/compound-complex per body paragraph; relative clauses used correctly; excellent length variety; [G8] = fully controlled
  5: 3–4 sentence types used; mostly controlled; 1–2 slightly awkward complex structures; good length variety
  4: At least 3 sentence types; some complex sentences attempted and mostly successful; some repetitive patterns; [G8] mostly controlled
  3: Mostly simple + basic compound; complex sentences attempted but 3–4 break down; [G1] dominates; limited length variety
  2: Almost entirely simple sentences; complex structures frequently break down; very repetitive patterns
  1: Only simple sentences; no variety; no controlled complex structures
  0: Sentence structure completely uncontrolled — cannot be parsed

━━━ 5. VOCABULARY (0–2)  ← Enabling skill ━━━
Check every content word:
  [V1] List ALL collocations found and label each: natural / forced / incorrect
  [V2] List every content word used 3+ times (word repetition)
  [V3] Identify ALL memorised opener/closer phrases: "In today's fast-paced world", "It goes without saying", "First and foremost", "Last but not least", "In conclusion I believe", "To sum up", "In my humble opinion", "Needless to say", "At the end of the day"
  [V4] Check for informal register: "kids", "stuff", "a lot of things", "very big", "got"
  [V5] Check word form errors: using an adjective where a noun is needed, etc.

SCORE:
  2: 3+ natural collocations [V1]; no word repeated 3+ times [V2]; zero memorised phrases [V3]; academic register throughout [V4]
  1: 1–2 natural collocations; OR 1 word repeated 3+ times; OR 1–2 memorised phrases; mostly appropriate register
  0: No natural collocations; multiple repetitions; multiple memorised phrases; basic or informal register

━━━ 6. GRAMMAR (0–2)  ← Enabling skill ━━━
Check every sentence for:
  [GR1] Subject-verb agreement ("The number of students are/is…")
  [GR2] Article usage (a/an/the — missing or incorrect)
  [GR3] Tense consistency — unexpected shifts mid-essay
  [GR4] Preposition accuracy ("responsible of/for", "benefit of/from", "depends of/on")
  [GR5] Pronoun reference clarity
  [GR6] Sentence fragments or run-on sentences
  [GR7] Word form errors (noun/verb/adjective/adverb confusion)

SCORE:
  2: 0–1 total errors across all 7 checks
  1: 2–4 errors that do not impede meaning
  0: 5+ errors OR errors that frequently make the meaning unclear

━━━ 7. SPELLING (0–2)  ← Enabling skill ━━━
Count ALL spelling errors including:
  - Misspelled words (government/goverment, necessary/neccesary, receive/recieve)
  - Confused homophones (their/there/they're, its/it's, affect/effect)

SCORE:
  2: 0–1 spelling errors
  1: 2–4 spelling errors
  0: 5+ spelling errors OR spelling errors that impede readability

═══════════════════════════════════════════════
PART B — STRICT MODEL ESSAY THEORY
(Apply ONLY when modelEssay is requested)
═══════════════════════════════════════════════

A Band 85+ PTE essay follows this EXACT sentence-by-sentence structure:

PARAGRAPH 1 — INTRODUCTION (exactly 2 sentences, ~40 words):
  Sentence 1 — BACKGROUND: Paraphrase the topic in completely your own words. Do NOT copy the topic.
    Introduce the context of the issue naturally. No position yet.
  Sentence 2 — THESIS: State your clear position AND preview BOTH main arguments.
    Formula: "While [acknowledging counter-position], [your position] because [argument 1] and [argument 2]."

PARAGRAPH 2 — BODY 1 (exactly 5 sentences, ~70 words):
  Sentence 1 — TOPIC SENTENCE: State the FIRST main argument. Must directly prove the thesis. Specific, not vague.
  Sentence 2 — EXPLANATION: WHY is this true? Use cause-and-effect reasoning. Do NOT restate the topic sentence.
  Sentence 3 — ELABORATION: Develop further. A secondary reason, consequence, or supporting contrast.
  Sentence 4 — EXAMPLE: A specific, concrete example (can be hypothetical but must be realistic and precise).
  Sentence 5 — LINK: Connect this argument back to the thesis. No new ideas.

PARAGRAPH 3 — BODY 2 (exactly 5 sentences, ~70 words):
  Same 5-sentence structure as Body 1 but with the SECOND main argument.
  The second argument must be clearly DIFFERENT from the first — not a variation of the same point.
  For "discuss both views" topics: BP1 = View 1, BP2 = View 2 + your position on it.

PARAGRAPH 4 — CONCLUSION (exactly 1 sentence, ~20 words):
  Restate the thesis in completely different words. DO NOT copy the thesis.
  DO NOT use "In conclusion" or "To sum up" — restate the position directly.
  Formula: "Given that [argument 1 rephrased] and [argument 2 rephrased], [position restated]."

VOCABULARY RULES FOR MODEL ESSAY:
  • Include at least 3 natural academic collocations
  • BANNED phrases: "In today's fast-paced world", "It goes without saying", "First and foremost", "Last but not least", "In conclusion I believe", "To sum up", "In my humble opinion", "Needless to say"
  • Sentence variety REQUIRED: at least 2 complex sentences (subordinating conjunction), 1 compound sentence, 1 sentence with relative clause
  • Word count: 220–250 words — count before finalising

QUALITY CHECKLIST before outputting model essay:
  ✓ Thesis in sentence 2 is specifically proven by BP1 and BP2
  ✓ Every sentence in BP1 proves only the BP1 topic sentence — zero drift to other ideas
  ✓ Every sentence in BP2 proves only the BP2 topic sentence — zero drift to other ideas
  ✓ Conclusion says the same thing as the thesis but in different words
  ✓ No banned phrases used anywhere
  ✓ Word count is 220–250

═══════════════════════════════════════════════
SCORING RULES
═══════════════════════════════════════════════
• Run through the CHECKLIST for each criterion before assigning the score
• Do NOT assign a score and then find reasons to justify it — check first, score after
• Content → DSC → GLR dominate. Vocabulary, Grammar, Spelling, Form are enabling skills.
• DSC ≤ 3 caps overall band at approximately 55 regardless of vocabulary
• DSC ≥ 5 required for band 70+
• Content 5–6 + DSC 5–6 + GLR 5–6 + clean enabling skills = Band 80–90
• Content 4–5 + DSC 4–5 + GLR 4–5 + solid enabling skills = Band 65–79
• Content 3–4 + DSC 3 + GLR 3 = Band 50–65

Return ONLY valid JSON (no markdown, no text outside the JSON object). overallBand and bandLabel are recalculated server-side — set both to 0 and "":
{
  "overallBand": 0,
  "bandLabel": "",
  "summaryTitle": "<brief honest title reflecting actual quality>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "criteria": [
    {"name":"Content","score":<0-6>,"max":6,"color":"#8b5cf6","comment":"<state which content checks passed/failed and why this score was given>"},
    {"name":"Form","score":<0-2>,"max":2,"color":"#2563eb","comment":"<state exact paragraph count and word count>"},
    {"name":"Development, Structure & Coherence","score":<0-6>,"max":6,"color":"#10b981","comment":"<state which DSC checks passed/failed — note DSC threshold if score ≤ 3>"},
    {"name":"General Linguistic Range","score":<0-6>,"max":6,"color":"#f59e0b","comment":"<state which sentence types were found and whether structures were controlled>"},
    {"name":"Vocabulary","score":<0-2>,"max":2,"color":"#ec4899","comment":"<list collocations found and note any memorised phrases or repetition>"},
    {"name":"Grammar","score":<0-2>,"max":2,"color":"#ef4444","comment":"<state total error count and most critical error types found>"},
    {"name":"Spelling","score":<0-2>,"max":2,"color":"#6366f1","comment":"<state exact spelling error count>"}
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
  "modelEssay": "<if requested: Band 85+ essay following EXACT theory — 2-sentence intro (background+thesis), 5-sentence BP1 (topic→explain→elaborate→example→link), 5-sentence BP2 (same structure, different argument), 1-sentence conclusion (thesis restated in different words) — 220-250 words, 3+ natural collocations, no banned phrases, varied sentence structures — empty string if not requested>",
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
      userMessage += `\n\nMODEL ESSAY REQUIRED — follow the strict PTE theory from Part B exactly:
Para 1 (2 sentences): Sentence 1 = background paraphrase of the topic. Sentence 2 = thesis stating your position + 2 main arguments.
Para 2 (5 sentences): S1=topic sentence proving thesis, S2=cause-effect explanation, S3=elaboration/development, S4=specific concrete example, S5=link back to thesis.
Para 3 (5 sentences): Same structure, second distinct argument. For discuss-both-views topics: BP1=View1, BP2=View2.
Para 4 (1 sentence): Restate thesis in completely different words. No new ideas. Do NOT use "In conclusion" or "To sum up".
Rules: 220-250 words exactly. 3+ natural collocations. No banned phrases. At least 2 complex sentences, 1 compound, 1 relative clause.
Before writing, confirm your thesis is proven by both body paragraphs. After writing, check your conclusion says the same thing as the thesis but differently. Place the essay in the 'modelEssay' field.`;
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
