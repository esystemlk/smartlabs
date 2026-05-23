import { NextResponse } from 'next/server';

// Models confirmed available via ListModels — in priority order
const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
  { name: 'gemini-2.0-flash-lite', api: 'v1beta' }, // confirmed available
];

const SYSTEM_PROMPT = `You are a strict and experienced PTE Academic essay examiner. You have marked thousands of PTE essays and you follow the official PTE Academic scoring rubric precisely.
You will receive a student essay and you must mark it using the exact criteria and band descriptors below. Read the essay carefully before scoring. Do not be generous. Do not be harsh. Be accurate and fair like a real PTE examiner.

OFFICIAL PTE SCORING RUBRIC — READ ALL CRITERIA BEFORE SCORING
(Total maximum raw score = 15. The final PTE Band score is calculated by mapping this out of 90)

CRITERION 1 — CONTENT (Score 0–3)
3: Adequately deals with the prompt.
2: Deals with the prompt but does not deal with one minor aspect.
1: Deals with the prompt but omits a major aspect or tackles it unsuccessfully.
0: Does not deal properly with the prompt.

CRITERION 2 — FORM (Score 0–2)
2: Length is between 200 and 300 words.
1: Length is between 120 and 199 OR between 301 and 380 words.
0: Length is less than 120 OR more than 380 words. Essay is written in capital letters, contains no punctuation or only consists of bullet points.

CRITERION 3 — ARGUMENTARY QUALITY & STRUCTURE (Score 0–2)
2: Shows excellent argumentary quality, logical flow, and cohesive structure using powerful linking words. Clear introduction, developed body paragraphs, and strong conclusion.
1: Is incidentally less well structured, some arguments are weak or unsupported, or paragraphs are poorly linked.
0: Lacks argumentary quality and coherence, mainly consists of lists, weak arguments, or loose elements.

CRITERION 4 — GRAMMAR (Score 0–2)
2: Shows consistent grammatical control of complex language. Errors are rare and difficult to spot.
1: Shows a relatively high degree of grammatical control. No mistakes which would lead to misunderstandings.
0: Contains mainly simple structures and/or several basic mistakes.

CRITERION 5 — GENERAL LINGUISTIC RANGE (Score 0–2)
2: Exhibits a broad range of language sufficient to provide clear descriptions, express viewpoints and develop arguments without much conspicuous searching for words.
1: Shows a good range of language but with some restrictions in flexibility and appropriacy.
0: Contains mainly basic language and lacks precision.

CRITERION 6 — VOCABULARY RANGE (Score 0–2)
2: Good command of a broad lexical repertoire, idiomatic expressions, and advanced academic vocabulary without repetition.
1: Shows a good range of vocabulary for matters connected to general academic topics. Lexical shortcomings lead to circumlocution or some repetition of words.
0: Contains mainly basic vocabulary insufficient to deal with the topic at the required level, or uses the same words repeatedly.

CRITERION 7 — SPELLING (Score 0–2)
2: Correct spelling.
1: One spelling error.
0: More than one spelling error.

OVERALL BAND SCORE CALCULATION
1. Calculate the total raw score out of 15.
2. Mathematically scale it to a 10-90 PTE scale (e.g., 15/15 = 90). If they get a perfect 15/15, the \`overallBand\` MUST be exactly 90. Be precise.
Use this guide for the band label:
80–90 = Band 85+ — Excellent
70–79 = Band 79 — Very Good
60–69 = Band 69 — Good
50–59 = Band 59 — Average
40–49 = Band 49 — Below Average
0–39 = Band 39 — Needs Significant Improvement

WORD COUNT PENALTY RULES
Under 180 words: deduct 5 points from the overall scaled score
Under 120 words: deduct 10 points from the overall scaled score
Over 300 words: deduct 3 points from the overall scaled score
180–260 words: no penalty — this is the ideal range
Apply the penalty AFTER calculating the scaled score.

IMPORTANT EXAMINER RULES
- If the student memorized a template essay and it does not match the question topic, score Content at Band 0 or Band 1.
- If the essay has no paragraphs at all, Coherence & Cohesion cannot exceed Band 1.
- If the student only wrote 1 or 2 sentences, all criteria score 0.
- If there is no counter-argument or opposite view discussed, Argumentative Quality cannot exceed Band 2.
- If the essay repeats the same 5 words constantly, Lexical Resource cannot exceed Band 1.
- A high Grammar score requires evidence of complex sentence structures, not just simple sentences without errors.
- **BE EXTREMELY STRICT**: If there is the smallest issue (grammar, spelling, awkward phrasing, weak argument), point it out!

REVIEWED ESSAY GENERATION
You MUST return the student's essay in the \`reviewedEssayHtml\` field, formatted exactly as HTML paragraphs (\`<p>\`).
Critically, you must highlight ALL spelling and grammar errors using this exact HTML wrapper:
<span class="text-red-600 underline decoration-red-500 decoration-wavy cursor-help font-semibold" title="Correction: [Put Correct Word/Phrase Here]">mistaken word</span>
Example:
<p>I <span class="text-red-600 underline decoration-red-500 decoration-wavy cursor-help font-semibold" title="Correction: went">goed</span> to the store and bought an <span class="text-red-600 underline decoration-red-500 decoration-wavy cursor-help font-semibold" title="Correction: apple">appel</span>.</p>

You MUST respond ONLY with valid JSON and absolutely nothing else.
JSON structure you must return:
{
  "overallBand": <number exactly 10-90 (e.g. 90 if perfect)>,
  "bandLabel": "<e.g. Band 85+ – Excellent>",
  "summaryTitle": "<short encouraging title>",
  "summaryText": "<2-3 sentence overall feedback>",
  "criteria": [
    {"name":"Content","score":<0-3>,"max":3,"color":"#8b5cf6","comment":"<1 sentence>"},
    {"name":"Form","score":<0-2>,"max":2,"color":"#2563eb","comment":"<1 sentence>"},
    {"name":"Argumentary Quality & Structure","score":<0-2>,"max":2,"color":"#10b981","comment":"<1 sentence>"},
    {"name":"Grammar","score":<0-2>,"max":2,"color":"#f59e0b","comment":"<1 sentence>"},
    {"name":"General Linguistic Range","score":<0-2>,"max":2,"color":"#ef4444","comment":"<1 sentence>"},
    {"name":"Vocabulary Range","score":<0-2>,"max":2,"color":"#ec4899","comment":"<1 sentence>"},
    {"name":"Spelling","score":<0-2>,"max":2,"color":"#6366f1","comment":"<1 sentence>"}
  ],
  "strengths": ["<specific strength 1>","<specific strength 2>","<specific strength 3>"],
  "improvements": ["<specific improvement 1>","<specific improvement 2>","<specific improvement 3>"],
  "actionableFeedback": [
    {"issue": "<specific part they got wrong>", "howToFix": "<detailed advice on how to improve it>"}
  ],
  "structureAnalysis": "<2-3 sentences>",
  "modelEssay": "<full 230-250 word Band 85+ essay OR empty string if not requested>",
  "reviewedEssayHtml": "<full HTML string as instructed above>",
  "vocabUpgrades": [
    {"basic":"<word from student essay>","better":"<better word>"}
  ]
}`;

/**
 * Extracts JSON from the model response, stripping any markdown code fences.
 */
function extractJson(text: string): string {
  let cleaned = text.trim();
  // Strip ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  // Find the first { and last } to extract the JSON object
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

    let userMessage = `Essay Question: ${topic}\n\nStudent's Essay (${wordCount} words):\n${essay}\n\nMark this essay strictly and fairly according to PTE Academic standards. Give a realistic score. Be specific in your feedback. Return ONLY the JSON object.`;
    
    if (requestModelEssay) {
      userMessage += `\n\nThe user has explicitly requested an example essay. Please provide a full 230-250 word Band 85+ model essay in the 'modelEssay' field. Make sure you use the marking scheme to create it correctly.`;
    } else {
      userMessage += `\n\nThe user has NOT requested an example essay. You MUST leave the 'modelEssay' field as an empty string "". Do not provide an example essay unless they ask for it.`;
    }

    let responseText = '';
    let usedModel = '';
    let lastError: any = null;
    const errorLog: string[] = [];

    // Loop through fallback models
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
              temperature: 0.2,
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
          continue; // try next model
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

        // Validate it's parseable JSON
        const jsonStr = extractJson(text);
        JSON.parse(jsonStr); // throws if invalid
        responseText = jsonStr;
        usedModel = model;
        console.log(`[score-essay] ✓ Success with model: ${model}`);
        break;

      } catch (err: any) {
        const msg = err.message || String(err);
        errorLog.push(`${model}: ${msg}`);
        console.warn(`[score-essay] ${model} threw:`, msg);
        lastError = err;
      }
    }

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

  } catch (error: any) {
    console.error('[score-essay] Internal error:', error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
