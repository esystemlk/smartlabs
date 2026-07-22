import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lists Write From Dictation questions WITHOUT their transcripts.
 *
 * The transcript is the answer, so it must never reach the browser before the
 * student submits — otherwise it's readable in devtools. Scoring happens
 * server-side in /api/score-wfd, which looks the transcript up by id.
 */
export async function GET(request: Request) {
  try {
    // Sign-in required. The transcripts are withheld either way, but without
    // this any anonymous visitor could enumerate the whole dictation audio
    // library — every other question-bank route is already authenticated.
    const auth = await verifyAuthed(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }

    const snap = await adminDb
      .collection('pte_questions')
      .where('section', '==', 'listening')
      .where('taskType', '==', 'write-from-dictation')
      .get();

    const questions = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: (data.title as string) ?? 'Dictation',
          audioUrl: (data.audioUrl as string) ?? '',
          active: data.active !== false,
          // wordCount is a safe hint — it doesn't reveal the words themselves.
          wordCount: String(data.content ?? '').trim().split(/\s+/).filter(Boolean).length,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        };
      })
      .filter(q => q.active)
      .sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[wfd/questions] error:', error);
    return NextResponse.json({ error: 'Failed to load questions.' }, { status: 500 });
  }
}
