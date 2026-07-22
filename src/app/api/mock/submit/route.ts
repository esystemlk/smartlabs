import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { internalHeaders } from '@/lib/internal-auth';
import { scoreWfd } from '@/lib/wfd-scoring';
import {
  TASK_MAX,
  aggregateScores,
  toPercent,
  type MockAttempt,
  type MockTaskScore,
  type MockAttemptQuestion,
} from '@/types/mock-test';

export const runtime = 'nodejs';
export const maxDuration = 300; // scoring 8 tasks can take a while
export const dynamic = 'force-dynamic';

/** Absolute base URL for calling our own API server-side. */
function baseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('host') ?? 'localhost:9002';
  return `${proto}://${host}`;
}

async function postJson(url: string, body: unknown, token: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...internalHeaders(), // tells the scorer not to charge its own credit
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Scorer returned ${res.status}`);
  return data;
}

/** One retry, because a single flaky AI call shouldn't cost a paid mock. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise(r => setTimeout(r, 1500));
    return await fn();
  }
}

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const token = header.slice(7);
    let uid: string;
    try {
      uid = (await adminAuth.verifyIdToken(token)).uid;
    } catch {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { attemptId } = (await request.json()) as { attemptId?: string };
    if (!attemptId) return NextResponse.json({ error: 'attemptId is required.' }, { status: 400 });

    const ref = adminDb.collection('mock_attempts').doc(attemptId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });

    const attempt = snap.data() as MockAttempt;
    if (attempt.userId !== uid) return NextResponse.json({ error: 'Not your attempt.' }, { status: 403 });

    // Already scored → return it (idempotent; a refresh mid-scoring is safe).
    if (attempt.status === 'scored') {
      return NextResponse.json({ alreadyScored: true, attempt: { id: attemptId, ...attempt } });
    }

    await ref.update({ status: 'submitted' });

    // ── Load every question's source material in one pass
    const ids = [...new Set(attempt.questions.map(q => q.questionId))];
    const qDocs = await Promise.all(
      ids.map(id => adminDb!.collection('pte_questions').doc(id).get())
    );
    const bank = new Map<string, { content: string; title: string }>();
    qDocs.forEach(d => {
      if (d.exists) {
        const v = d.data()!;
        bank.set(d.id, { content: String(v.content ?? ''), title: String(v.title ?? '') });
      }
    });

    const url = baseUrl(request);

    async function scoreOne(q: MockAttemptQuestion): Promise<MockTaskScore> {
      const source = bank.get(q.questionId);
      const base = { questionId: q.questionId, taskType: q.taskType, max: TASK_MAX[q.taskType] };

      // Unanswered questions score zero without burning an AI call.
      if (!q.answer.trim()) {
        return { ...base, raw: 0, percent: 0, detail: { skipped: true, title: source?.title } };
      }
      if (!source) {
        return { ...base, raw: 0, percent: 0, scoreFailed: true, error: 'Question no longer exists.' };
      }

      try {
        switch (q.taskType) {
          case 'swt': {
            const d = await withRetry(() =>
              postJson(`${url}/api/score-swt`, { passage: source.content, summary: q.answer }, token)
            );
            const raw = Number(d.total ?? 0);
            return { ...base, raw, percent: toPercent(raw, base.max), detail: d };
          }
          case 'write-essay': {
            const d = await withRetry(() =>
              postJson(`${url}/api/score-essay`, { topic: source.content, essay: q.answer }, token)
            );
            const criteria = (d.criteria ?? []) as { score?: number; max?: number }[];
            const raw = criteria.reduce((s, c) => s + (c.score ?? 0), 0);
            const max = criteria.reduce((s, c) => s + (c.max ?? 0), 0) || base.max;
            return { ...base, max, raw, percent: toPercent(raw, max), detail: d };
          }
          case 'summarize-spoken-text': {
            const d = await withRetry(() =>
              postJson(`${url}/api/score-sst`, { transcript: source.content, summary: q.answer }, token)
            );
            const raw = Number(d.total ?? 0);
            return { ...base, raw, percent: toPercent(raw, base.max), detail: d };
          }
          case 'write-from-dictation': {
            // Deterministic — no AI call, no network hop.
            const d = scoreWfd(source.content, q.answer);
            return {
              ...base,
              raw: d.correctWords,
              max: d.totalWords || base.max,
              percent: d.accuracy,
              detail: d,
            };
          }
        }
      } catch (e) {
        return {
          ...base,
          raw: 0,
          percent: 0,
          scoreFailed: true,
          error: e instanceof Error ? e.message : 'Scoring failed.',
        };
      }
    }

    // Score sequentially: gentler on the AI key pool and avoids rate limits.
    const taskScores: MockTaskScore[] = [];
    for (const q of attempt.questions) {
      taskScores.push(await scoreOne(q));
    }

    // If every task the student actually attempted failed to score, the AI
    // side is down — do NOT freeze that in as a real result. `scored` is
    // final and idempotent, so persisting it here would cost the student a
    // paid attempt for an outage. Leave it `submitted` (retryable) instead.
    const attempted = taskScores.filter(s => !s.detail || !(s.detail as { skipped?: boolean }).skipped);
    if (attempted.length > 0 && attempted.every(s => s.scoreFailed)) {
      return NextResponse.json(
        { error: 'Marking is temporarily unavailable. Your answers are saved — try again shortly.', retryable: true },
        { status: 503 }
      );
    }

    const overall = aggregateScores(taskScores);
    const scoredAt = Date.now();

    await ref.update({ status: 'scored', taskScores, overall, scoredAt });

    return NextResponse.json({
      attempt: { id: attemptId, ...attempt, status: 'scored', taskScores, overall, scoredAt },
    });
  } catch (error) {
    console.error('[mock/submit] error:', error);
    return NextResponse.json({ error: 'Scoring failed. Your answers are saved — please retry.' }, { status: 500 });
  }
}
