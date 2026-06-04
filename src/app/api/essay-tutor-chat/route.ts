import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Model priority — fast flash first, smarter pro as fallback.
const MODELS = [
  { name: 'gemini-2.5-flash', api: 'v1beta' },
  { name: 'gemini-2.5-pro', api: 'v1beta' },
];

// ─── API key cache (mirrors score-essay route) ──────────────────────────────
let _cachedKey: string | null = null;
let _cacheExpiry = 0;
let _cacheVersion = 0;
const CACHE_TTL_MS = 2 * 60 * 1000;

async function getApiKey(): Promise<string | null> {
  try {
    if (adminDb) {
      const ccSnap = await adminDb.collection('system_config').doc('cache_control').get();
      const remoteVersion: number = ccSnap.exists ? (ccSnap.data()?.keyVersion ?? 0) : 0;
      const valid = _cachedKey && Date.now() < _cacheExpiry && _cacheVersion === remoteVersion;
      if (!valid) {
        const snap = await adminDb.collection('system_config').doc('ai_settings').get();
        const key = snap.exists ? (snap.data()?.geminiApiKey as string | undefined) : undefined;
        if (key) {
          _cachedKey = key;
          _cacheExpiry = Date.now() + CACHE_TTL_MS;
          _cacheVersion = remoteVersion;
          return key;
        }
      } else {
        return _cachedKey;
      }
    }
  } catch (e) {
    console.warn('[essay-tutor-chat] Firestore key read failed, falling back to env:', e);
  }
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || null;
}

// ─── Condensed PTE rubric (distilled from score-essay system prompt) ─────────
const RUBRIC = `You evaluate using the official PTE Academic August 2025 scheme. Seven criteria:
1. CONTENT (0-6, GATE): on-topic, clear thesis, both body paragraphs prove it with cause-effect reasoning, conclusion restates without new ideas. If Content=0, everything is 0.
2. FORM (0-2, GATE): exactly 4 paragraphs and 200-300 words = 2. If Form=0, DSC/GLR/Vocab/Grammar/Spelling=0.
3. DEVELOPMENT, STRUCTURE & COHERENCE (DSC 0-6): topic sentences, one idea per paragraph, logical flow, varied transitions, thesis consistency. DSC must be >=5 for band 70+.
4. GENERAL LINGUISTIC RANGE (GLR 0-6): variety of simple/compound/complex sentences, controlled structures, relative clauses, length variety.
5. VOCABULARY (0-2): natural collocations, no repetition, precise word choice, formal register, no memorised phrases.
6. GRAMMAR (0-2): subject-verb agreement, articles, tense, prepositions, no fragments/run-ons.
7. SPELLING (0-2).
Content, DSC and GLR dominate the band. DSC<=3 caps the band near 55. Band = round(totalScore/26 * 90).`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(session: {
  topic?: string;
  essayText?: string;
  wordCount?: number;
  targetScore?: number | null;
  result: unknown;
}): string {
  const target = session.targetScore ? `The student's target is Band ${session.targetScore}.` : 'No target band was set.';
  return `You are "Alora", a warm, encouraging and expert PTE Academic writing tutor speaking LIVE with a student about the essay they just submitted. Your answers are spoken aloud by a text-to-speech voice, so keep them natural, conversational and concise.

${RUBRIC}

═══ THE STUDENT'S SUBMISSION ═══
Essay topic: ${session.topic ?? '(unknown)'}
Word count: ${session.wordCount ?? '(unknown)'}
${target}

Student's essay:
"""
${session.essayText ?? '(essay text unavailable)'}
"""

═══ THE FULL SCORING RESULT (authoritative — never contradict these numbers) ═══
${JSON.stringify(session.result)}

═══ HOW TO TUTOR ═══
- Speak directly to the student in the second person ("you"). Be supportive but honest.
- ALWAYS ground your guidance in this student's ACTUAL scores and the specific mistakes in the result above — quote their real sentences from grammarAnalysis.mistakes, argumentativeQuality.weakArguments, vocabularyCollocations.impreciseWords, and coherenceAnalysis.breakPoints.
- When asked about a criterion, explain their score, why they got it (per the rubric), and the single most impactful next step.
- Keep each reply SHORT and TTS-friendly: ~3-5 sentences, under ~120 words, plain spoken English. Avoid long lists unless asked.
- If they ask to rewrite a sentence, give the improved version and one short reason.
- Encourage follow-up questions. Never invent scores that aren't in the result.`;
}

export async function POST(request: Request) {
  try {
    // ── Auth ──
    if (!adminAuth || !adminDb) {
      return new Response(JSON.stringify({ error: 'Server not configured.' }), { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401 });
    }
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), { status: 401 });
    }

    // ── Body ──
    const { sessionId, messages } = (await request.json()) as {
      sessionId?: string;
      messages?: ChatMessage[];
    };
    if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'sessionId and messages are required.' }), { status: 400 });
    }

    // ── Load the authoritative session from Firestore (don't trust client scores) ──
    const sessSnap = await adminDb
      .collection('users').doc(uid)
      .collection('essay_sessions').doc(sessionId)
      .get();
    if (!sessSnap.exists) {
      return new Response(JSON.stringify({ error: 'Session not found.' }), { status: 404 });
    }
    const session = sessSnap.data() as {
      topic?: string; essayText?: string; wordCount?: number; targetScore?: number | null; result: unknown;
    };

    const apiKey = await getApiKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI key not configured.' }), { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(session);
    const contents = messages
      .filter(m => m.content?.trim())
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    // ── Try models in order; fall back only BEFORE the first byte streams ──
    let upstream: Response | null = null;
    for (const { name, api } of MODELS) {
      // Disable "thinking" on flash so it answers instantly instead of spending
      // the whole output budget thinking (which returns no visible text).
      const generationConfig: Record<string, unknown> = { temperature: 0.4, maxOutputTokens: 2048 };
      if (name.includes('flash')) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }
      const body = JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig,
      });
      const url = `https://generativelanguage.googleapis.com/${api}/models/${name}:streamGenerateContent?alt=sse&key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (res.ok && res.body) {
          upstream = res;
          break;
        }
        const errText = await res.text().catch(() => '');
        console.warn(`[essay-tutor-chat] ${name} returned ${res.status}: ${errText.slice(0, 300)}`);
      } catch (e) {
        console.warn(`[essay-tutor-chat] ${name} threw:`, e);
      }
    }

    if (!upstream || !upstream.body) {
      return new Response(JSON.stringify({ error: 'All AI models are busy. Please try again.' }), { status: 502 });
    }

    // ── Parse upstream SSE line-by-line (robust to \r\n) and re-emit text ──
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = '';
        let emitted = false;
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? ''; // keep the incomplete trailing line

            for (const raw of lines) {
              const line = raw.replace(/\r$/, '').trim();
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                const parts = json?.candidates?.[0]?.content?.parts;
                if (Array.isArray(parts)) {
                  for (const p of parts) {
                    if (p?.thought) continue; // skip thinking tokens
                    if (typeof p?.text === 'string' && p.text) {
                      controller.enqueue(encoder.encode(p.text));
                      emitted = true;
                    }
                  }
                }
              } catch {
                /* ignore non-JSON keep-alive lines */
              }
            }
          }
          if (!emitted) {
            controller.enqueue(encoder.encode("I couldn't generate a response just now. Please try asking again."));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[essay-tutor-chat] error:', error);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
