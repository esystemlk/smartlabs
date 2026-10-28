import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import {
  loadSkimContent, toPublicSteps, defaultProgress, stepStates,
  isStepUnlocked, gradeStep, mergeStepProgress, allPassed,
} from '@/lib/ielts-skimming/service';
import type { SkimProgress } from '@/lib/ielts-skimming/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const progressRef = (uid: string, version: string) =>
  adminDb!.collection('users').doc(uid).collection('skimming').doc(version);

async function readProgress(uid: string, version: string): Promise<SkimProgress> {
  const snap = await progressRef(uid, version).get();
  const d = snap.data() as SkimProgress | undefined;
  return d?.version ? d : defaultProgress(version);
}

/** Student view: public steps + this student's progress and lock states. */
export async function GET(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const content = await loadSkimContent();
    const progress = await readProgress(auth.uid, content.version);
    return NextResponse.json({
      version: content.version,
      steps: toPublicSteps(content),
      states: stepStates(content, progress),
      progress: progress.steps,
      badge: { awarded: progress.badgeAwarded, at: progress.badgeAt },
    }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Could not load the challenge. Please try again.' }, { status: 500 });
  }
}

/** Submit one step's answers — graded server-side; answer keys never leave here until now. */
export async function POST(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.text();
    if (body.length > 8000) return NextResponse.json({ error: 'Submission too large.' }, { status: 413 });
    const { stepId, answers } = JSON.parse(body) as { stepId?: unknown; answers?: unknown };
    if (typeof stepId !== 'string' || !/^SKIM-\d{2}$/.test(stepId)) {
      return NextResponse.json({ error: 'Invalid step.' }, { status: 400 });
    }
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'Please submit your answers again.' }, { status: 400 });
    }

    const content = await loadSkimContent();
    const step = content.steps.find((s) => s.id === stepId);
    if (!step) return NextResponse.json({ error: 'Unknown step.' }, { status: 404 });

    const progress = await readProgress(auth.uid, content.version);
    if (!isStepUnlocked(content, progress, stepId)) {
      return NextResponse.json({ error: 'Pass the previous step to unlock this one.' }, { status: 403 });
    }

    const graded = gradeStep(step, answers as Record<string, unknown>);

    // Persist progress (first/best/latest + attempts) and attempt responses.
    const updatedStep = mergeStepProgress(progress.steps[stepId], graded.score, graded.passed);
    const nextProgress: SkimProgress = {
      ...progress,
      version: content.version,
      steps: { ...progress.steps, [stepId]: updatedStep },
      updatedAt: Date.now(),
    };
    const nowAllPassed = allPassed(content, nextProgress);
    const justEarnedBadge = nowAllPassed && !progress.badgeAwarded;
    if (justEarnedBadge) { nextProgress.badgeAwarded = true; nextProgress.badgeAt = Date.now(); }

    await progressRef(auth.uid, content.version).set(nextProgress);
    await adminDb!.collection('users').doc(auth.uid).collection('skimming_attempts').add({
      version: content.version, stepId, answers, score: graded.score, total: graded.total,
      passed: graded.passed, createdAt: Date.now(),
    });
    if (justEarnedBadge) {
      await adminDb!.collection('users').doc(auth.uid).set(
        { skimmingMasterBadge: { version: content.version, awardedAt: Date.now() } }, { merge: true },
      );
    }

    return NextResponse.json({
      stepId, score: graded.score, total: graded.total, passMark: graded.passMark, passed: graded.passed,
      results: graded.results,
      states: stepStates(content, nextProgress),
      badge: { awarded: nextProgress.badgeAwarded, at: nextProgress.badgeAt, justEarned: justEarnedBadge },
    }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Some answers could not be read. Please try again.' }, { status: 400 });
  }
}
