import { NextResponse } from 'next/server';

const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
  { name: 'gemini-3.1-pro',   api: 'v1beta' },
];

const SYSTEM_PROMPT = `You are an expert PTE Academic Essay evaluator trained in modern high-scoring PTE writing strategies. Evaluate the student essay very critically and strategically based on actual PTE scoring requirements.

MAIN PTE SCORING AREAS:
1. Content (0–6): How well the essay addresses the topic and develops the thesis
2. Form (0–2): Word count (ideal 220–250), exactly 4-paragraph structure
3. Development (0–2): Argumentative quality, logical reasoning, example support
4. Vocabulary (0–2): Natural academic word choice, collocations, variety
5. Grammar (0–2): Sentence accuracy, variety, controlled structures
6. Coherence (0–2): Flow, transitions, paragraph unity, logical progression
7. Spelling (0–1): Spelling accuracy

STRUCTURE RULES (apply strictly):
- The essay MUST contain exactly 4 paragraphs: Introduction, Body Paragraph 1, Body Paragraph 2, Conclusion
- Introduction: exactly 2 sentences (background sentence + thesis statement)
- Body Paragraph 1: approximately 5 sentences discussing ONE central idea
- Body Paragraph 2: approximately 5 sentences discussing ONE central idea (different from BP1)
- Conclusion: exactly 1 sentence (restates thesis, introduces NO new ideas)
- Ideal word count: 220–250 words. Penalize significantly below 200 or above 300.

COHERENCE AND COHESION RULES (check strictly):
- Each paragraph MUST discuss ONLY ONE central idea
- ALL supporting sentences inside the paragraph must prove or explain that ONE central topic
- Paragraph unity violations must be explicitly identified
- Logical progression between sentences must be smooth
- Topic sentences must clearly guide the paragraph direction
- Linking words must be natural and varied — not forced or repetitive

THESIS STATEMENT RULE:
- The thesis stated in the introduction MUST be proven throughout the essay
- Body paragraphs must directly support the thesis
- The conclusion must restate the thesis — no new ideas in the conclusion
- If arguments drift from the thesis, reduce Content and Development scores

VOCABULARY & COLLOCATION RULES:
- Do NOT reward robotic or memorized vocabulary — penalize it explicitly
- Reward natural academic vocabulary that fits the context
- Look for strong collocations such as: technological advancement, global economy, social responsibility, environmental protection, mental health issues, practical experience, economic growth, academic performance, critical thinking, sustainable development, long-term consequences, fundamental right
- Evaluate each collocation found: is it natural, forced, or incorrect?
- Identify and flag repetitive words and memorized template phrases

ARGUMENTATIVE QUALITY RULES:
- Arguments must be explained logically with clear cause-and-effect reasoning
- Each claim needs explanation and support — not just a statement
- Avoid shallow "listing" of ideas without development
- Strong reasoning matters more than impressive vocabulary

GRAMMAR RULES:
- Check sentence variety — penalize when all sentences follow the same pattern
- Identify specific grammar errors with exact corrections
- Note punctuation mistakes separately (comma splices, missing commas, etc.)
- Reward clear and controlled grammatical structures

SCORING CALIBRATION (use realistic scores, not default middle scores):
- Essay with strong arguments, good structure, natural language: 70–80
- Essay with excellent structure, thesis consistency, rich collocations, varied grammar: 80–85+
- Essay with multiple coherence breaks, weak arguments, grammar errors, wrong structure: 50–65
- Essay with correct structure but shallow content and basic vocabulary: 60–70
- Do NOT always score 65–70 — calibrate honestly based on actual quality

Return ONLY valid JSON (absolutely no markdown, no text outside the JSON object):
{
  "overallBand": <number 10-90>,
  "bandLabel": "<e.g. Band 79>",
  "summaryTitle": "<brief honest title reflecting actual quality>",
  "summaryText": "<2-3 sentences of overall honest feedback>",
  "criteria": [
    {"name":"Content","score":<0-6>,"max":6,"color":"#8b5cf6","comment":"<1-2 sentence comment>"},
    {"name":"Form","score":<0-2>,"max":2,"color":"#2563eb","comment":"<1-2 sentence comment>"},
    {"name":"Development","score":<0-2>,"max":2,"color":"#10b981","comment":"<1-2 sentence comment>"},
    {"name":"Vocabulary","score":<0-2>,"max":2,"color":"#f59e0b","comment":"<1-2 sentence comment>"},
    {"name":"Grammar","score":<0-2>,"max":2,"color":"#ef4444","comment":"<1-2 sentence comment>"},
    {"name":"Coherence","score":<0-2>,"max":2,"color":"#ec4899","comment":"<1-2 sentence comment>"},
    {"name":"Spelling","score":<0-1>,"max":1,"color":"#6366f1","comment":"<1-2 sentence comment>"}
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
    "breakPoints": ["<exact description of where coherence breaks, e.g. 'Body Paragraph 1 shifts mid-paragraph from discussing X to Y without connection'>"]
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
  "actionableFeedback": [{"issue": "<specific identifiable problem in the essay>", "howToFix": "<concrete specific solution>"}]
}`;

function extractJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const { topic, essay, wordCount, requestModelEssay } = await request.json();

    if (!topic || !essay) {
      return NextResponse.json(
        { error: 'Topic and essay content are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error('Server Configuration Error: Gemini API key is missing.');
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

    let responseText = '';
    let usedModel = '';
    let lastError: unknown = null;
    const errorLog: string[] = [];

    for (const { name: model, api } of MODELS) {
      try {
        console.log(`[score-essay] Trying model: ${model} (${api})`);
        const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userMessage }]
              }
            ],
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.1,
            }
          })
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let msg = `HTTP ${response.status}`;
          try { msg = JSON.parse(errorBody)?.error?.message || msg; } catch {}
          const logMsg = `${model}: ${msg}`;
          errorLog.push(logMsg);
          console.warn(`[score-essay] ${logMsg}`);
          lastError = new Error(logMsg);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          const reason = data.candidates?.[0]?.finishReason || 'no text returned';
          errorLog.push(`${model}: empty response (${reason})`);
          console.warn(`[score-essay] ${model}: empty response — ${reason}`);
          lastError = new Error(`Empty response from ${model}`);
          continue;
        }

        const jsonStr = extractJson(text);
        JSON.parse(jsonStr);
        responseText = jsonStr;
        usedModel = model;
        console.log(`[score-essay] ✓ Success with model: ${model}`);
        break;

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errorLog.push(`${model}: ${msg}`);
        console.warn(`[score-essay] ${model} threw:`, msg);
        lastError = err;
      }
    }

    void lastError;

    if (!responseText) {
      console.error('[score-essay] All models exhausted:', errorLog);
      return NextResponse.json(
        {
          error: 'All AI models failed to score the essay. Please try again in a moment.',
          details: errorLog,
        },
        { status: 502 }
      );
    }

    const parsedJson = JSON.parse(responseText);

    return NextResponse.json({
      ...parsedJson,
      _metadata: { modelUsed: usedModel }
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
