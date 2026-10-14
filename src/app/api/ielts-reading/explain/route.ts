import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

// Rotate across the same Gemini keys the scorers use.
let _k = 0;
function apiKey(): string | null {
  const keys = [1, 2, 3, 4, 5].map(i => process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '').filter(Boolean);
  if (!keys.length) return null;
  return keys[_k++ % keys.length];
}

const SYSTEM = `You are an experienced IELTS Academic Reading teacher. A student has just answered one reading question. Using ONLY the passage text given, explain the answer in 2–4 short sentences:
1. Where in the passage the answer comes from (quote the key phrase briefly).
2. Why the correct answer is right.
3. The common trap — a tempting but wrong answer and why students pick it.
Be concise and plain. Do not add headings or markdown. Do not invent facts beyond the passage.`;

export async function POST(request: Request) {
  try {
    // Logged-in users only (reading practice lives in the dashboard) — keeps the
    // AI calls from being hit anonymously. No credit is charged.
    const authHeader = request.headers.get('Authorization');
    if (!adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    try { await adminAuth.verifyIdToken(authHeader.slice(7)); }
    catch { return NextResponse.json({ error: 'Session expired.' }, { status: 401 }); }

    const { testId, questionId, passage, question, accepted, number } = await request.json();
    if (typeof passage !== 'string' || !passage.trim() || !Array.isArray(accepted)) {
      return NextResponse.json({ error: 'Missing question context.' }, { status: 400 });
    }

    // The explanation is the same for every student (it explains the correct
    // answer + the trap, not their answer), so cache it once per question.
    const cacheId = typeof testId === 'string' && questionId != null
      ? `${testId}:${questionId}`.replace(/[^a-zA-Z0-9:_-]/g, '_') : null;
    const cacheRef = cacheId && adminDb ? adminDb.collection('ielts_reading_explanations').doc(cacheId) : null;
    if (cacheRef) {
      const hit = await cacheRef.get();
      const cached = hit.data()?.explanation;
      if (typeof cached === 'string' && cached) return NextResponse.json({ explanation: cached, cached: true });
    }

    const key = apiKey();
    if (!key) return NextResponse.json({ error: 'AI is not configured on the server.' }, { status: 500 });

    const userMsg = `PASSAGE:\n${passage.slice(0, 9000)}\n\nQUESTION ${number ?? ''}: ${question || '(gap to complete)'}\nCORRECT ANSWER(S): ${accepted.join(' / ')}\n\nExplain how to arrive at this answer for a student.`;

    let text = '';
    for (let attempt = 0; attempt <= 2 && !text; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userMsg }] }],
            systemInstruction: { parts: [{ text: SYSTEM }] },
            generationConfig: { maxOutputTokens: 400, temperature: 0.2 },
          }),
        });
        if (!res.ok) { if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; } break; }
        const data = await res.json();
        text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
      } catch { if (attempt < 2) await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); }
    }

    if (!text) return NextResponse.json({ error: 'Could not generate an explanation. Please try again.' }, { status: 502 });

    if (cacheRef) { try { await cacheRef.set({ explanation: text, createdAt: new Date() }); } catch { /* cache write is best-effort */ } }
    return NextResponse.json({ explanation: text });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
