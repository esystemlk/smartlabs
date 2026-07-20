import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyStaff } from '@/lib/api-auth';
import { MOCK_BLUEPRINT, type MockSection, type MockTest } from '@/types/mock-test';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COL = 'mock_tests';

/** List all mocks (staff view). */
export async function GET(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const snap = await adminDb!.collection(COL).get();
  const mocks = snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<MockTest, 'id'>) }))
    .sort((a, b) => {
      const ta = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      const tb = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      return tb - ta;
    });

  // Attempt counts, so staff can see usage at a glance.
  const counts: Record<string, number> = {};
  for (const m of mocks) {
    const c = await adminDb!.collection('mock_attempts').where('mockId', '==', m.id).count().get();
    counts[m.id!] = c.data().count;
  }

  return NextResponse.json({ mocks, attemptCounts: counts });
}

/**
 * Validates a mock against the fixed blueprint. A mock that fails these checks
 * would strand a student mid-exam, so publishing is blocked until it passes.
 */
async function validate(sections: MockSection[]): Promise<string[]> {
  const errors: string[] = [];

  for (const spec of MOCK_BLUEPRINT) {
    const section = sections.find(s => s.taskType === spec.taskType);
    if (!section) {
      errors.push(`Missing section: ${spec.label}.`);
      continue;
    }
    if (section.questionIds.length !== spec.count) {
      errors.push(
        `${spec.label} needs exactly ${spec.count} question${spec.count > 1 ? 's' : ''} (has ${section.questionIds.length}).`
      );
    }
  }

  const all = sections.flatMap(s => s.questionIds);
  if (new Set(all).size !== all.length) {
    errors.push('The same question is used more than once.');
  }

  // Every question must exist, match its task type, and — for audio tasks —
  // actually have audio, or the student hits a silent question.
  for (const section of sections) {
    for (const qid of section.questionIds) {
      const snap = await adminDb!.collection('pte_questions').doc(qid).get();
      if (!snap.exists) {
        errors.push(`Question ${qid} no longer exists.`);
        continue;
      }
      const q = snap.data()!;
      if (q.taskType !== section.taskType) {
        errors.push(`"${q.title}" is not a ${section.taskType} question.`);
      }
      if (!String(q.content ?? '').trim()) {
        errors.push(`"${q.title}" has no content/transcript.`);
      }
      const needsAudio =
        section.taskType === 'summarize-spoken-text' || section.taskType === 'write-from-dictation';
      if (needsAudio && !String(q.audioUrl ?? '').trim()) {
        errors.push(`"${q.title}" has no audio uploaded.`);
      }
    }
  }

  return errors;
}

/** Create or update a mock. Body: { id?, title, description?, active, sections }. */
export async function POST(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<MockTest> & { id?: string };
  const { id, title, description, active, sections } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: 'Sections are required.' }, { status: 400 });
  }

  // Only a mock being published must be complete — drafts can be half-built.
  const errors = active ? await validate(sections) : [];
  if (errors.length) {
    return NextResponse.json({ error: 'Cannot publish yet.', validationErrors: errors }, { status: 400 });
  }

  const payload = {
    title: title.trim(),
    description: (description ?? '').trim(),
    active: !!active,
    sections: sections.map(s => ({
      taskType: s.taskType,
      questionIds: s.questionIds ?? [],
      secondsPerQuestion:
        s.secondsPerQuestion ??
        MOCK_BLUEPRINT.find(b => b.taskType === s.taskType)?.secondsPerQuestion ??
        600,
    })),
    updatedAt: new Date(),
  };

  if (id) {
    await adminDb!.collection(COL).doc(id).set(payload, { merge: true });
    return NextResponse.json({ success: true, id });
  }

  const ref = await adminDb!.collection(COL).add({
    ...payload,
    createdAt: new Date(),
    createdBy: auth.uid,
  });
  return NextResponse.json({ success: true, id: ref.id });
}

/** Delete a mock. Attempts are kept for the record. */
export async function DELETE(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  await adminDb!.collection(COL).doc(id).delete();
  return NextResponse.json({ success: true });
}
