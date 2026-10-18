import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { generateWithFailover, AiBusyError } from '@/lib/gemini-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

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

    const userMsg = `PASSAGE:\n${passage.slice(0, 9000)}\n\nQUESTION ${number ?? ''}: ${question || '(gap to complete)'}\nCORRECT ANSWER(S): ${accepted.join(' / ')}\n\nExplain how to arrive at this answer for a student.`;

    let text = '';
    try {
      const r = await generateWithFailover({
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: SYSTEM }] },
        generationConfig: { maxOutputTokens: 400, temperature: 0.2 },
        deadlineMs: 35_000,
      });
      text = r.text;
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_KEYS') return NextResponse.json({ error: 'AI is not configured on the server.' }, { status: 500 });
      const busy = err instanceof AiBusyError;
      return NextResponse.json({ error: busy ? 'The AI is busy right now — please try again in a moment.' : 'Could not generate an explanation. Please try again.' }, { status: busy ? 503 : 502 });
    }

    if (cacheRef) { try { await cacheRef.set({ explanation: text, createdAt: new Date() }); } catch { /* cache write is best-effort */ } }
    return NextResponse.json({ explanation: text });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
