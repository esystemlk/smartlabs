import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { MOCK_BLUEPRINT, type MockAttempt } from '@/types/mock-test';
import { syncProgress } from '@/lib/mock-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns an attempt plus the material needed to render the CURRENT question
 * only. Future questions (and every dictation transcript) stay on the server,
 * so a student cannot read ahead or lift answers out of the network tab.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    let uid: string;
    try {
      uid = (await adminAuth.verifyIdToken(header.slice(7))).uid;
    } catch {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const snap = await adminDb.collection('mock_attempts').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });

    const attempt = snap.data() as MockAttempt;
    if (attempt.userId !== uid) return NextResponse.json({ error: 'Not your attempt.' }, { status: 403 });

    // Bring the attempt up to date with the clock before rendering: skips any
    // question whose time expired while the tab was closed, and starts the
    // timer on the question now in front of the student.
    const nowTs = Date.now();
    if (attempt.status === 'in_progress' && syncProgress(attempt, nowTs)) {
      await snap.ref.update({
        questions: attempt.questions,
        currentIndex: attempt.currentIndex,
      });
    }

    const finished = attempt.status !== 'in_progress';
    const idx = attempt.currentIndex;
    let current: Record<string, unknown> | null = null;

    if (!finished && idx < attempt.questions.length) {
      const q = attempt.questions[idx];
      const qSnap = await adminDb.collection('pte_questions').doc(q.questionId).get();
      const data = qSnap.exists ? qSnap.data()! : {};
      const spec = MOCK_BLUEPRINT.find(s => s.taskType === q.taskType);
      const isDictation = q.taskType === 'write-from-dictation';
      const isSpoken = q.taskType === 'summarize-spoken-text';

      current = {
        index: idx,
        total: attempt.questions.length,
        taskType: q.taskType,
        label: spec?.label ?? q.taskType,
        instructions: spec?.instructions ?? '',
        deadlineAt: q.deadlineAt,
        answer: q.answer,
        title: data.title ?? '',
        // Prompt text is sent only for tasks the student is meant to READ.
        // Dictation and spoken-summary answers live in `content`, so they are
        // withheld until scoring.
        content: isDictation || isSpoken ? '' : String(data.content ?? ''),
        audioUrl: isDictation || isSpoken ? String(data.audioUrl ?? '') : '',
      };
    }

    return NextResponse.json({
      attempt: {
        id,
        mockId: attempt.mockId,
        mockTitle: attempt.mockTitle,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        currentIndex: attempt.currentIndex,
        totalQuestions: attempt.questions.length,
        taskScores: attempt.taskScores ?? null,
        overall: attempt.overall ?? null,
      },
      current,
      serverNow: Date.now(),
    });
  } catch (error) {
    console.error('[mock/attempt] error:', error);
    return NextResponse.json({ error: 'Could not load the attempt.' }, { status: 500 });
  }
}
