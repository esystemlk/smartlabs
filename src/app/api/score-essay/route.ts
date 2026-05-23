import { NextResponse } from 'next/server';

// Models confirmed available via ListModels — in priority order
const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro',   api: 'v1beta' },
  { name: 'gemini-2.0-flash', api: 'v1beta' },
  { name: 'gemini-3.1-pro',   api: 'v1beta' },
];

const SYSTEM_PROMPT = `You are a PTE Academic Essay evaluator. Evaluate essays based on official PTE criteria and provide realistic scores.

SCORING CRITERIA:
- Content (0-6): How well the essay addresses the topic
- Form (0-2): Word count (200-300 ideal) and structure  
- Development (0-2): Argument quality and examples
- Vocabulary (0-2): Natural word choice and variety
- Grammar (0-2): Accuracy and sentence variety
- Coherence (0-2): Flow and transitions
- Spelling (0-1): Accuracy

IMPORTANT GUIDELINES:
- Reward clear arguments and logical reasoning
- Don't penalize simple vocabulary if it's used correctly
- Good essays should score 70-85%, not consistently 60%
- Focus on argumentative quality - this is crucial for PTE
- Natural language is better than overly complex vocabulary

Return ONLY valid JSON in this format:
{
  "overallBand": <number 10-90>,
  "bandLabel": "<e.g. Band 79>",
  "summaryTitle": "<encouraging title>",
  "summaryText": "<brief overall feedback>",
  "criteria": [
    {"name":"Content","score":<0-6>,"max":6,"color":"#8b5cf6","comment":"<brief comment>"},
    {"name":"Form","score":<0-2>,"max":2,"color":"#2563eb","comment":"<brief comment>"},
    {"name":"Development","score":<0-2>,"max":2,"color":"#10b981","comment":"<brief comment>"},
    {"name":"Vocabulary","score":<0-2>,"max":2,"color":"#f59e0b","comment":"<brief comment>"},
    {"name":"Grammar","score":<0-2>,"max":2,"color":"#ef4444","comment":"<brief comment>"},
    {"name":"Coherence","score":<0-2>,"max":2,"color":"#ec4899","comment":"<brief comment>"},
    {"name":"Spelling","score":<0-1>,"max":1,"color":"#6366f1","comment":"<brief comment>"}
  ],
  "strengths": ["<strength 1>","<strength 2>","<strength 3>"],
  "improvements": ["<improvement 1>","<improvement 2>","<improvement 3>"],
  "structureAnalysis": "<brief structure analysis>",
  "modelEssay": "<model essay if requested, empty string otherwise>",
  "reviewedEssayHtml": "<essay with error highlighting>",
  "vocabUpgrades": [{"basic":"<word>","better":"<alternative>"}],
  "actionableFeedback": [{"issue":"<problem>","howToFix":"<solution>"}]
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

    let userMessage = `Essay Topic: ${topic}

Student Essay (${wordCount} words):
${essay}

Please evaluate this essay using PTE Academic criteria. Focus on realistic scoring - good essays should score 70-85%, not consistently 60%. Argumentative quality is crucial. Return only the JSON response.`;
    
    if (requestModelEssay) {
      userMessage += `\n\nInclude a Band 85+ model essay (230-250 words) in the 'modelEssay' field.`;
    } else {
      userMessage += `\n\nLeave 'modelEssay' field as empty string.`;
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
              maxOutputTokens: 4096,
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
