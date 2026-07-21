import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { verifyMockCredit, deductMockCredit, refundMockCredit } from '@/lib/mock-credits';
import {
  MOCK_BLUEPRINT,
  type MockTest,
  type MockAttempt,
  type MockAttemptQuestion,
  type MockTaskType,
} from '@/types/mock-test';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Starts (or resumes) a mock attempt.
 *
 * Deadlines are computed HERE and stored on the attempt. The browser only
 * renders a countdown from them — it never decides when time is up, so
 * refreshing, closing the tab or editing client state cannot buy extra time.
 *
 * One credit is spent when the attempt is created, never at scoring, so a
 * scoring failure can't cost a student twice.
 */
export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Sign in to start the mock test.', code: 'NO_AUTH' }, { status: 401 });
    }
    let uid: string; let email: string | undefined; let name: string | undefined;
    try {
      const d = await adminAuth.verifyIdToken(header.slice(7));
      uid = d.uid; email = d.email;
      name = (d as { name?: string }).name;
    } catch {
      return NextResponse.json({ error: 'Session expired. Sign in again.', code: 'INVALID_AUTH' }, { status: 401 });
    }

    const { mockId } = (await request.json()) as { mockId?: string };
    if (!mockId) return NextResponse.json({ error: 'mockId is required.' }, { status: 400 });

    // ── Resume an in-progress attempt instead of starting (and charging) again.
    const existing = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('mockId', '==', mockId)
      .where('status', '==', 'in_progress')
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return NextResponse.json({ attemptId: doc.id, attempt: { id: doc.id, ...doc.data() }, resumed: true });
    }

    // ── Load the mock definition
    const mockSnap = await adminDb.collection('mock_tests').doc(mockId).get();
    if (!mockSnap.exists) return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    const mock = mockSnap.data() as MockTest;
    if (mock.active === false) {
      return NextResponse.json({ error: 'This mock test is not available.' }, { status: 403 });
    }

    // ── Validate it is fully built before charging anyone
    const problems: string[] = [];
    for (const spec of MOCK_BLUEPRINT) {
      const section = mock.sections?.find(s => s.taskType === spec.taskType);
      const n = section?.questionIds?.length ?? 0;
      if (n !== spec.count) problems.push(`${spec.label}: needs ${spec.count}, has ${n}`);
    }
    if (problems.length) {
      return NextResponse.json(
        { error: 'This mock test is incomplete.', details: problems },
        { status: 409 }
      );
    }

    // ── Credit gate
    const credit = await verifyMockCredit(uid);
    if (!credit.ok) {
      return NextResponse.json(
        { error: credit.message, code: credit.code, remaining: credit.remaining },
        { status: credit.status }
      );
    }

    // ── Build the question list in blueprint order with absolute deadlines
    const now = Date.now();
    const questions: MockAttemptQuestion[] = [];
    let order = 0;
    let totalSeconds = 0;

    // Each question carries its OWN budget. Deadlines are stamped when the
    // student actually reaches the question (see lib/mock-runtime), so
    // finishing early never adds the spare time onto the next question.
    for (const spec of MOCK_BLUEPRINT) {
      const section = mock.sections.find(s => s.taskType === spec.taskType)!;
      const perQuestion = section.secondsPerQuestion || spec.secondsPerQuestion;
      for (const questionId of section.questionIds) {
        totalSeconds += perQuestion;
        questions.push({
          questionId,
          taskType: spec.taskType as MockTaskType,
          order: order++,
          secondsAllowed: perQuestion,
          deadlineAt: 0, // 0 = not reached yet
          answer: '',
        });
      }
    }

    // Only the first question's clock starts now.
    questions[0].startedAt = now;
    questions[0].deadlineAt = now + questions[0].secondsAllowed * 1000;

    const attempt: MockAttempt = {
      mockId,
      mockTitle: mock.title,
      userId: uid,
      userEmail: email,
      userName: name,
      status: 'in_progress',
      startedAt: now,
      // Generous safety bound only — real enforcement is per question.
      expiresAt: now + totalSeconds * 1000 * 3,
      currentIndex: 0,
      questions,
    };

    // Spend the credit, then create. If creation fails, hand the credit back.
    await deductMockCredit(uid);
    try {
      const ref = await adminDb.collection('mock_attempts').add(attempt);
      return NextResponse.json({ attemptId: ref.id, attempt: { id: ref.id, ...attempt }, resumed: false });
    } catch (e) {
      await refundMockCredit(uid);
      throw e;
    }
  } catch (error) {
    console.error('[mock/start] error:', error);
    return NextResponse.json({ error: 'Could not start the mock test.' }, { status: 500 });
  }
}
