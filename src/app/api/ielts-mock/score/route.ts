import { NextResponse } from 'next/server';
import React from 'react';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { internalHeaders } from '@/lib/internal-auth';
import { getMock } from '@/lib/ielts-mock/mocks';
import { getCambridge21WritingTest } from '@/lib/ielts-writing/cambridge-21';
import { getListeningBundle, getReadingBundle, gradeTest } from '@/lib/ielts-mock/registry.server';
import { listeningBand, academicReadingBand, writingBand, overallMockBand, bandLabel } from '@/lib/ielts-mock/bands';
import { IeltsMockScorePDF } from '@/components/ielts/IeltsMockScorePDF';
import { mockResultEmail } from '@/lib/email/mock-result-email';
import { sendMail } from '@/lib/mail';
import type { IeltsEssayResult } from '@/types/ielts-essay';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';

// Email the student their result (best-effort). The PDF attachment is built
// separately so that if PDF rendering fails, the result email still goes out.
// Returns a status string for diagnostics (surfaced in the response).
async function emailResult(uid: string, result: IeltsMockResult): Promise<{ sent: boolean; detail: string }> {
  if (!adminAuth) return { sent: false, detail: 'no-admin' };
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return { sent: false, detail: 'mail-not-configured' };

  let to: string | undefined;
  let studentName = 'Student';
  try {
    const userRec = await adminAuth.getUser(uid);
    to = userRec.email ?? undefined;
    studentName = userRec.displayName || 'Student';
  } catch (e) {
    console.error('[ielts-mock/score] getUser failed:', e);
    return { sent: false, detail: 'getUser-failed' };
  }
  if (!to) return { sent: false, detail: 'no-email' };

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // Build the PDF, but don't let a rendering failure block the email.
  let attachments: { filename: string; content: Buffer; contentType: string }[] | undefined;
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const pdf = await renderToBuffer(
      React.createElement(IeltsMockScorePDF, { meta: { studentName, studentEmail: to, date: dateLabel }, result }) as React.ReactElement<import('@react-pdf/renderer').DocumentProps>,
    );
    attachments = [{ filename: `SmartLabs_IELTS_Mock_${result.title.replace(/[^a-z0-9]+/gi, '_')}.pdf`, content: pdf, contentType: 'application/pdf' }];
  } catch (e) {
    console.error('[ielts-mock/score] PDF render failed, sending email without attachment:', e);
  }

  try {
    const { subject, html } = mockResultEmail(studentName, result, dateLabel);
    await sendMail({ to, subject, html, attachments });
    return { sent: true, detail: attachments ? 'sent-with-pdf' : 'sent-no-pdf' };
  } catch (e) {
    console.error('[ielts-mock/score] sendMail failed:', e);
    return { sent: false, detail: 'send-failed' };
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 160;

async function imageToBase64(origin: string, path: string): Promise<{ data: string; mime: string } | null> {
  try {
    const res = await fetch(`${origin}${path}`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf.toString('base64'), mime: res.headers.get('content-type') || 'image/png' };
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.', code: 'UNAUTHENTICATED' }, { status: 401 });

    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' }, { status: 401 }); }

    const { attemptId, mockId, listeningAnswers, readingAnswers, writingTask1, writingTask2 } = await request.json();
    const mock = getMock(String(mockId));
    if (!mock) return NextResponse.json({ error: 'Unknown mock test.' }, { status: 400 });

    // Verify the attempt belongs to this user and is not already completed.
    const attemptRef = adminDb.collection('users').doc(uid).collection('ielts_mock_attempts').doc(String(attemptId));
    const attemptSnap = await attemptRef.get();
    if (!attemptSnap.exists) return NextResponse.json({ error: 'This mock attempt was not found. Please start the mock again.' }, { status: 404 });
    if (attemptSnap.data()?.status === 'completed') {
      return NextResponse.json({ error: 'This mock attempt has already been scored.', code: 'ALREADY_SCORED' }, { status: 409 });
    }

    // ── Listening + Reading (deterministic, server-side) ──
    const lBundle = getListeningBundle(mock.listening.testId);
    const rBundle = getReadingBundle(mock.reading.testId);
    if (!lBundle || !rBundle) return NextResponse.json({ error: 'Mock test data is unavailable.' }, { status: 500 });

    const lGrade = gradeTest(lBundle, listeningAnswers ?? {});
    const rGrade = gradeTest(rBundle, readingAnswers ?? {});
    const lBand = listeningBand(lGrade.raw);
    const rBand = academicReadingBand(rGrade.raw);

    // ── Writing (AI, scored internally so no essay credit is charged) ──
    const writing = getCambridge21WritingTest(mock.writingTestN);
    if (!writing) return NextResponse.json({ error: 'Mock writing data is unavailable.' }, { status: 500 });

    const origin = new URL(request.url).origin;
    const t1Text = String(writingTask1 ?? '').trim();
    const t2Text = String(writingTask2 ?? '').trim();
    if (!t1Text || !t2Text) return NextResponse.json({ error: 'Please complete both writing tasks before submitting.' }, { status: 400 });

    const img = await imageToBase64(origin, writing.task1.image);
    const headers = { 'Content-Type': 'application/json', Authorization: authHeader, ...internalHeaders() };

    const [t1Res, t2Res] = await Promise.all([
      fetch(`${origin}/api/score-ielts-task1`, {
        method: 'POST', headers,
        body: JSON.stringify({
          prompt: writing.task1.prompt, response: t1Text,
          wordCount: t1Text.split(/\s+/).filter(Boolean).length,
          visualType: writing.task1.visualType, keyFeatures: writing.task1.keyFeatures,
          imageBase64: img?.data, imageMime: img?.mime,
        }),
      }),
      fetch(`${origin}/api/score-ielts-essay`, {
        method: 'POST', headers,
        body: JSON.stringify({ topic: writing.task2.prompt, essay: t2Text, wordCount: t2Text.split(/\s+/).filter(Boolean).length }),
      }),
    ]);

    if (!t1Res.ok || !t2Res.ok) {
      console.error('[ielts-mock/score] writing scoring failed', t1Res.status, t2Res.status);
      return NextResponse.json({ error: 'The writing could not be scored. Your answers are safe — please try submitting again.' }, { status: 502 });
    }
    const t1Result = await t1Res.json() as IeltsEssayResult;
    const t2Result = await t2Res.json() as IeltsEssayResult;

    const wBand = writingBand(t1Result.overallBand, t2Result.overallBand);
    const overall = overallMockBand(lBand, rBand, wBand);

    const result: IeltsMockResult = {
      mockId: mock.id,
      title: mock.title,
      overall, overallLabel: bandLabel(overall),
      listening: { band: lBand, raw: lGrade.raw, total: lGrade.total, label: mock.listening.label },
      reading: { band: rBand, raw: rGrade.raw, total: rGrade.total, label: mock.reading.label },
      writing: { band: wBand, task1Band: t1Result.overallBand, task2Band: t2Result.overallBand, task1: t1Result, task2: t2Result, label: mock.writingLabel },
      scoredAt: new Date().toISOString(),
    };

    await attemptRef.set({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      overall, listeningBand: lBand, readingBand: rBand, writingBand: wBand,
      listeningRaw: lGrade.raw, readingRaw: rGrade.raw,
      writingTask1Band: t1Result.overallBand, writingTask2Band: t2Result.overallBand,
      // Full result so the student can re-view and download the PDF later.
      result,
    }, { merge: true });

    // Email the student their result with the PDF attached (awaited but
    // self-contained — a mail failure never fails the scoring response).
    const emailStatus = await emailResult(uid, result);

    return NextResponse.json({ ...result, emailStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ielts-mock/score]', error);
    return NextResponse.json({ error: `Could not score the mock test: ${message}` }, { status: 500 });
  }
}
