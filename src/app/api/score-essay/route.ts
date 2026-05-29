import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

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

━━━ 5. VOCABULARY RANGE (0–2)  ← Enabling skill — PTE measures this as a % sub-score ━━━
PTE's Vocabulary Range metric is strict. Run ALL checks before scoring. Always look for what is WRONG.

  [V1] COLLOCATIONS — scan every noun+verb, adjective+noun, verb+adverb pair:
    List EVERY collocation found. Label each: natural / forced / incorrect.
    Natural = the combination is standard in academic writing. Forced = unusual pairing. Incorrect = wrong collocation.
    Minimum 3 natural collocations needed for a score of 2.

  [V2] WORD REPETITION — go through every content word (nouns, verbs, adjectives, adverbs):
    Flag any content word that appears MORE THAN TWICE in the essay.
    Also flag if topic keywords (key nouns from the question) are repeated without substitution — this directly reduces vocabulary range.
    Even words like "education", "society", "technology" count if overused without synonyms.

  [V3] VOCABULARY PRECISION — this is the most common failure point. Check every key word:
    Is the student using the most precise word available, or a vague general word?
    PENALISE these imprecise substitutions:
      "good" → should be: beneficial, advantageous, effective, constructive, favourable
      "bad" → should be: detrimental, harmful, counterproductive, adverse, damaging
      "big/large" → should be: significant, substantial, considerable, extensive, widespread
      "important" → should be: crucial, pivotal, indispensable, fundamental, critical
      "show" → should be: demonstrate, illustrate, indicate, reveal, highlight
      "help" → should be: facilitate, enable, support, enhance, promote, foster
      "make" → should be: generate, create, produce, establish, develop
      "many people" → should be: a significant proportion of individuals, the majority of the population
      "a lot of" → should be: a considerable number of, a substantial amount of
      "use" → should be: utilise, employ, apply, implement, leverage
    Flag EVERY instance of imprecise word choice — do not overlook even one.

  [V4] ACADEMIC REGISTER — check every sentence:
    Flag informal words: "kids", "stuff", "things", "got", "very big", "really", "a lot"
    Flag contractions: don't, can't, it's, they're (unacceptable in formal academic writing)
    Flag conversational phrases: "you know", "of course", "as we all know", "everyone knows"

  [V5] MEMORISED PHRASES — flag EVERY occurrence:
    "In today's fast-paced world" / "It goes without saying" / "First and foremost" /
    "Last but not least" / "In conclusion I believe" / "To sum up" / "In my humble opinion" /
    "Needless to say" / "At the end of the day" / "plays a crucial role" (overused) /
    "plays an important role" (overused) / "since time immemorial" / "pros and cons"

  [V6] VOCABULARY SPREAD — estimate the % of unique content words:
    Divide unique content words by total content words.
    Below 80% unique → score 0. Below 90% unique → score 1. 90%+ unique → can score 2.

SCORE (only score 2 if ALL conditions met):
  2: 3+ natural collocations [V1] + no content word used 3+ times [V2] + precise word choices throughout [V3] + no informal register [V4] + zero memorised phrases [V5] + ~90%+ word variety [V6]
  1: Mostly good vocabulary but fails 1–2 of the above checks (e.g., 1–2 imprecise words, OR 1 repetition, OR 1 memorised phrase)
  0: Fails 3+ checks — vague vocabulary, clear repetition, memorised phrases, informal register

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
PART B — STRICT MODEL ESSAY GENERATION
(Apply ONLY when modelEssay is requested)
═══════════════════════════════════════════════

TARGET: This essay must score 90%+ on BOTH Vocabulary Range AND Argument Quality when evaluated by PTE's official scoring engine. Apply the rules below without exception.

━━━ STRUCTURE (mandatory) ━━━

PARAGRAPH 1 — INTRODUCTION (exactly 2 sentences, ~40 words):
  S1 — BACKGROUND: Paraphrase the topic in your own words. Do NOT copy any phrase from the topic verbatim.
    Introduce the context naturally. No position stated yet.
  S2 — THESIS: State a CLEAR POSITION and preview BOTH main arguments in specific terms.
    Formula: "While [acknowledging counter-position], [position] because [argument 1] and [argument 2]."
    The two arguments must be DISTINCT — not variations of the same idea.

PARAGRAPH 2 — BODY 1 (exactly 5 sentences, ~70 words):
  S1 — TOPIC SENTENCE: State the first argument specifically. Must be debatable and directly prove the thesis.
    ✗ WRONG: "Education is beneficial for people." (too generic)
    ✓ RIGHT: "Access to quality education directly determines an individual's capacity to compete in the modern workforce."
  S2 — MECHANISM (cause-effect explanation): Explain the causal chain — WHY and HOW this is true.
    Must use cause-effect language: "This is because...", "As a result...", "This leads to...", "Consequently...", "This means that..."
    ✗ WRONG: "Education helps people get jobs." (repeats the claim, no mechanism)
    ✓ RIGHT: "This is because structured learning develops critical thinking and technical competencies that employers actively seek, thereby enhancing graduates' employability."
  S3 — ELABORATION: Add a second layer of reasoning — a consequence, implication, or contrast that deepens S2.
    Must contribute NEW information — never paraphrase S2.
    Use: "Furthermore...", "Moreover...", "This is particularly evident when...", "Even in cases where...", "Unlike..."
  S4 — SPECIFIC EVIDENCE: A concrete, precise example. Generic examples destroy Argument Quality scores.
    ✗ BANNED: "For example, many people in the world...", "For instance, various studies show...", "Many countries have..."
    ✓ REQUIRED: A specific scenario, realistic hypothetical with precise detail, or named context.
    ✓ EXAMPLE: "For instance, a student from a low-income household who gains a university scholarship can break the cycle of generational poverty by securing a professional career that was previously inaccessible to their family."
  S5 — LINK BACK: One sentence connecting this argument back to the thesis. No new ideas.

PARAGRAPH 3 — BODY 2 (exactly 5 sentences, ~70 words):
  Same S1–S5 structure as Body 1 with the SECOND distinct argument.
  For "discuss both views" topics: BP1 = View A fully argued, BP2 = View B fully argued + your position.
  For "agree/disagree" topics: Both body paragraphs argue FOR your stated position with two different reasons.
  The second argument must be clearly independent from the first — not the same point rephrased.

PARAGRAPH 4 — CONCLUSION (exactly 1 sentence, ~20 words):
  Restate the thesis in completely different vocabulary. Do NOT copy any phrase from the thesis sentence.
  Do NOT start with "In conclusion", "To sum up", "Therefore I believe".
  Formula: "Given that [argument 1 rephrased with different words] and [argument 2 rephrased], [position restated]."

━━━ ARGUMENT QUALITY REQUIREMENTS (target 90%+) ━━━
The most common reason model essays score low on Argument Quality is shallow reasoning. Every argument must pass:

  [AQ1] DEPTH TEST: Does S2 go beyond restating S1? Does it explain the causal mechanism, not just rephrase the claim?
  [AQ2] SPECIFICITY TEST: Is S4 a genuinely specific example — not "many people", not "various countries", not "studies show"?
  [AQ3] DEVELOPMENT TEST: Does S3 add a new dimension (consequence, implication, contrast) — not just a reworded S2?
  [AQ4] RELEVANCE TEST: Does every sentence in each body paragraph DIRECTLY prove that paragraph's topic sentence?
  [AQ5] INDEPENDENCE TEST: Are BP1 and BP2 arguing genuinely DIFFERENT aspects — not the same point from two angles?

Before writing, plan: "My BP1 argument is X. The mechanism is Y. My specific evidence is Z."
After writing, check each body paragraph against AQ1–AQ5. Rewrite any sentence that fails.

━━━ VOCABULARY RANGE REQUIREMENTS (target 90%+) ━━━
The most common vocabulary failure is imprecise word choice and repetition. Apply strictly:

  [VR1] NO IMPRECISE WORDS — replace every instance before finalising:
    "good/bad" → beneficial/detrimental, advantageous/counterproductive
    "important/big" → crucial/significant, pivotal/substantial, indispensable/considerable
    "show/help/make/use/get" → demonstrate/facilitate/generate/employ/acquire
    "people/things/stuff" → individuals/factors/elements (context-specific)
    "a lot of/many" → a significant proportion of/a considerable number of/the majority of

  [VR2] ZERO CONTENT WORD REPETITION — scan every noun, verb, adjective after writing:
    If any content word appears more than twice, replace one occurrence with a precise synonym.
    This includes topic keywords — vary them: "education" → "academic development", "schooling", "the educational system"

  [VR3] COLLOCATIONS — use at least 4 natural academic collocations from this list (pick ones that fit the topic naturally):
    significant impact, long-term consequences, sustainable development, academic performance,
    economic growth, critical thinking, social responsibility, technological advancement,
    environmental protection, fundamental right, global community, professional development,
    mental health, cultural diversity, public awareness, equal opportunity

  [VR4] ZERO BANNED PHRASES — scan entire essay before finalising:
    "In today's fast-paced world" / "It goes without saying" / "First and foremost" /
    "Last but not least" / "In conclusion I believe" / "To sum up" / "In my humble opinion" /
    "Needless to say" / "plays a crucial/important role" (overused) / "pros and cons"

  [VR5] SENTENCE VARIETY — verify before finalising:
    At least 2 complex sentences using: although, because, since, while, unless, even though, given that
    At least 1 compound sentence using: and, but, yet, so
    At least 1 relative clause using: which, who, whose, that

━━━ FINAL CHECKS before outputting model essay ━━━
  ✓ AQ1–AQ5: every argument passes the depth, specificity, development, relevance, independence tests
  ✓ VR1: no imprecise word remains — scan every key word
  ✓ VR2: no content word appears more than twice — scan for repetition
  ✓ VR3: 4+ natural collocations confirmed
  ✓ VR4: zero banned phrases — scan the full text
  ✓ VR5: sentence variety confirmed (2 complex, 1 compound, 1 relative clause)
  ✓ Structure: intro=2 sentences, BP1=5, BP2=5, conclusion=1
  ✓ Word count: 220–250 — count and adjust if needed
  ✓ Conclusion uses completely different vocabulary from the thesis sentence

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
    "explanationDepth": "<for EACH body paragraph: does S2 explain the causal mechanism (why/how) — or does it just restate S1? Quote specific evidence of shallow or deep reasoning>",
    "logicQuality": "<is each claim logically supported with a clear causal chain? identify any logical gap where a cause-effect link is missing or unjustified>",
    "exampleSupport": "<are S4 examples specific and concrete — or generic (many people / various countries / studies show)? quote the actual example and rate its specificity>",
    "relevanceOfIdeas": "<does every sentence in BP1 prove only BP1's topic sentence, and every sentence in BP2 prove only BP2's topic sentence? flag any sentence that drifts>",
    "criticalThinking": "<does the writer go beyond obvious surface observations? do they address implications, consequences, or nuance — or just state commonly known facts?>",
    "weakArguments": ["<quote the EXACT sentence that is the weakest argument — identify whether it fails on depth, specificity, or relevance>"],
    "howToImprove": ["<give a rewritten version of the weak argument showing what a strong causal-chain argument looks like for this specific point>"]
  },
  "vocabularyCollocations": {
    "strongVocabulary": ["<precise academic word used correctly — include the sentence it appears in>"],
    "collocationsUsed": [{"collocation": "<exact collocation found>", "evaluation": "<natural / forced / incorrect — explain why>"}],
    "repetitiveVocabulary": ["<content word + exact count — e.g. 'education × 4' — that reduces vocabulary range>"],
    "impreciseWords": ["<vague word used + the precise alternative that should have been used — e.g. 'important → crucial/pivotal'>"],
    "awkwardPhrases": ["<unnatural or imprecise phrase with suggested replacement>"],
    "memorizedLanguage": ["<exact memorised phrase found — flag even subtle ones like 'plays a crucial role'>"]
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

// ─── Auth + credit system ─────────────────────────────────────────────────────

type AuthCreditResult =
  | { ok: true;  uid: string; unlimited: boolean }
  | { ok: false; status: number; code: string; message: string; extra?: Record<string, unknown> };

const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const FREE_ESSAY_LIMIT = 2;

async function verifyAuthAndCredits(
  authHeader:  string | null,
  fingerprint: string | null
): Promise<AuthCreditResult> {
  if (!adminDb || !adminAuth) {
    return { ok: false, status: 500, code: 'SERVER_ERROR', message: 'Server configuration error.' };
  }

  // 1. Require Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      code: 'NO_AUTH',
      message: 'You must be signed in to score essays. Please create a free account to continue.',
    };
  }

  // 2. Verify Firebase ID token
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'INVALID_AUTH',
      message: 'Your session has expired. Please sign in again.',
    };
  }

  // 3. Load user document
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};
  const role: string = (userData.role as string) ?? 'student';

  // 4. Unlimited roles bypass all credit checks
  if (UNLIMITED_ROLES.has(role)) {
    return { ok: true, uid, unlimited: true };
  }

  // 5. Anti-abuse: check if this device fingerprint belongs to a different account
  //    that has already exhausted free credits
  if (fingerprint && fingerprint.length > 8) {
    try {
      const fpSnap = await adminDb.collection('deviceFingerprints').doc(fingerprint).get();
      if (fpSnap.exists) {
        const fpData = fpSnap.data()!;
        const firstUid: string = (fpData.firstUid as string) ?? '';
        if (firstUid && firstUid !== uid) {
          const origSnap = await adminDb.collection('users').doc(firstUid).get();
          const origData = origSnap.data() ?? {};
          const origRole = (origData.role as string) ?? 'student';
          if (!UNLIMITED_ROLES.has(origRole)) {
            const origFree: number      = (origData.essayFreeUsed as number)    ?? 0;
            const origPaid: number      = (origData.essayPaidCredits as number) ?? 0;
            const origExpiry            = origData.essayMonthlyExpiry?.toDate?.() ?? null;
            const origHasMonthly        = !!(origExpiry && origExpiry > new Date());
            if (origFree >= FREE_ESSAY_LIMIT && origPaid <= 0 && !origHasMonthly) {
              return {
                ok: false,
                status: 403,
                code: 'BLOCKED_DEVICE',
                message:
                  'This device has already been used to access free essay scoring on a different account. ' +
                  'Free credits are limited to 2 essays per device to ensure fair access for all students. ' +
                  'Please purchase credits to continue, or contact support if you believe this is an error.',
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('[score-essay] Fingerprint check failed (non-blocking):', e);
    }
  }

  // 6. Check current user credit balance
  const freeUsed: number   = (userData.essayFreeUsed    as number) ?? 0;
  const paidCredits: number = (userData.essayPaidCredits as number) ?? 0;
  const monthlyExpiry       = userData.essayMonthlyExpiry?.toDate?.() ?? null;
  const hasMonthly          = !!(monthlyExpiry && monthlyExpiry > new Date());

  if (!hasMonthly && paidCredits <= 0 && freeUsed >= FREE_ESSAY_LIMIT) {
    return {
      ok: false,
      status: 402,
      code: 'NO_CREDITS',
      message: `You have used your ${FREE_ESSAY_LIMIT} free essay scorings. Purchase credits to keep practising.`,
      extra: { freeUsed, freeTotal: FREE_ESSAY_LIMIT, paidCredits, hasMonthly },
    };
  }

  return { ok: true, uid, unlimited: false };
}

async function deductEssayCredit(uid: string, deductGen: boolean): Promise<void> {
  if (!adminDb) return;
  try {
    const userRef  = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};

    const monthlyExpiry = userData.essayMonthlyExpiry?.toDate?.() ?? null;
    const hasMonthly    = !!(monthlyExpiry && monthlyExpiry > new Date());

    const updates: Record<string, number> = {};

    // Deduct scoring credit
    if (!hasMonthly) {
      const paidCredits: number = (userData.essayPaidCredits as number) ?? 0;
      if (paidCredits > 0) {
        updates.essayPaidCredits = paidCredits - 1;
      } else {
        const freeUsed: number = (userData.essayFreeUsed as number) ?? 0;
        updates.essayFreeUsed = freeUsed + 1;
      }
    }

    // Deduct generation credit if model essay was requested
    if (deductGen) {
      const genCredits: number = (userData.essayGenCredits as number) ?? 0;
      if (genCredits > 0) {
        updates.essayGenCredits = genCredits - 1;
      }
      // If no gen credits but it's a free user — we still allow (legacy free behaviour)
    }

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
    }
  } catch (e) {
    console.warn('[score-essay] Credit deduction failed:', e);
  }
}

async function recordDeviceFingerprint(uid: string, fingerprint: string): Promise<void> {
  if (!adminDb || !fingerprint || fingerprint.length < 8) return;
  try {
    const fpRef  = adminDb.collection('deviceFingerprints').doc(fingerprint);
    const fpSnap = await fpRef.get();
    if (!fpSnap.exists) {
      await fpRef.set({ firstUid: uid, firstSeenAt: new Date(), lastSeenAt: new Date(), allUids: [uid] });
    } else {
      const data    = fpSnap.data()!;
      const allUids = Array.isArray(data.allUids)
        ? (data.allUids as string[])
        : [(data.firstUid as string) ?? uid];
      if (!allUids.includes(uid)) allUids.push(uid);
      await fpRef.update({ lastSeenAt: new Date(), allUids });
    }
  } catch (e) {
    console.warn('[score-essay] Fingerprint record failed:', e);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // ── 1. Auth + credit check (before body parse — saves AI quota on blocked requests) ──
    const authHeader  = request.headers.get('Authorization');
    const fingerprint = request.headers.get('x-device-fingerprint') ?? '';

    const authResult = await verifyAuthAndCredits(authHeader, fingerprint);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code, ...(authResult.extra ?? {}) },
        { status: authResult.status }
      );
    }
    const { uid, unlimited } = authResult;

    // ── 2. Parse request body ─────────────────────────────────────────────────
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
      userMessage += `\n\nMODEL ESSAY REQUIRED — follow Part B exactly. This essay must score 90%+ on BOTH Argument Quality AND Vocabulary Range.

STRUCTURE:
Para 1 (2 sentences): S1=background paraphrase (no copying). S2=thesis with clear position + 2 specific distinct arguments previewed.
Para 2 (5 sentences): S1=specific debatable topic sentence. S2=causal mechanism using cause-effect language (NOT a restatement of S1). S3=elaboration adding a NEW consequence or implication (NOT a paraphrase of S2). S4=SPECIFIC concrete example — no "many people/various countries/studies show". S5=link back to thesis.
Para 3 (5 sentences): Same structure, second INDEPENDENT argument (not a variation of BP1).
Para 4 (1 sentence): Thesis restated in completely different vocabulary. No "In conclusion" opener.

ARGUMENT QUALITY CHECKS (run before finalising):
- Does S2 in each body paragraph explain WHY/HOW using cause-effect reasoning — not just restate S1?
- Is S4 in each body paragraph a specific, precise example — not generic?
- Are BP1 and BP2 genuinely different arguments?

VOCABULARY RANGE CHECKS (run before finalising):
- Replace every: good/bad/big/important/show/help/make/use with precise academic alternatives
- Scan every content word — if any noun/verb/adjective appears more than twice, replace one
- Confirm 4+ natural collocations, zero banned phrases, 2+ complex sentences

Word count: 220–250. Place the final essay in the 'modelEssay' field.`;
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
            generationConfig : { maxOutputTokens: 65536, temperature: 0.1 },
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

    // ── Deduct credit + record device fingerprint (fire-and-forget) ──────────
    // IMPORTANT: only deduct gen credit if the model essay was ACTUALLY produced,
    // not just because the user requested it. Empty string = AI failed to generate.
    const modelEssayActuallyGenerated = typeof parsed.modelEssay === 'string' && parsed.modelEssay.trim().length > 50;

    if (!unlimited) {
      deductEssayCredit(uid, modelEssayActuallyGenerated).catch(() => {});
      if (fingerprint) recordDeviceFingerprint(uid, fingerprint).catch(() => {});
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
