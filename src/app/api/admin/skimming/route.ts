import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyStaff } from '@/lib/api-auth';
import { loadSkimContent, SKIM_CONTENT_COL } from '@/lib/ielts-skimming/service';
import type { SkimContent, SkimStep, SkimQuestion } from '@/lib/ielts-skimming/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

/** Full content incl. answer keys — for the admin editor only. */
export async function GET(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const content = await loadSkimContent();
    return NextResponse.json({ content }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Could not load content.' }, { status: 500 });
  }
}

function validateContent(c: unknown): string | null {
  if (!c || typeof c !== 'object') return 'Missing content.';
  const content = c as Partial<SkimContent>;
  if (typeof content.version !== 'string' || !/^[A-Za-z0-9._-]{1,40}$/.test(content.version)) return 'Invalid version.';
  if (!Array.isArray(content.steps) || content.steps.length === 0) return 'At least one step is required.';
  for (const s of content.steps as SkimStep[]) {
    if (!s || !/^SKIM-\d{2}$/.test(s.id)) return 'Each step needs an id like SKIM-01.';
    if (!s.title?.trim() || !s.level?.trim()) return `Step ${s.id}: title and level are required.`;
    if (!Array.isArray(s.passage) || s.passage.some((p) => !p?.text?.trim())) return `Step ${s.id}: every paragraph needs text.`;
    if (!Array.isArray(s.questions) || s.questions.length === 0) return `Step ${s.id}: at least one question is required.`;
    for (const q of s.questions as SkimQuestion[]) {
      if (!q?.id || !q.prompt?.trim()) return `Step ${s.id}: a question is missing its prompt.`;
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some((o) => !String(o).trim())) return `${q.id}: needs at least 2 non-empty options.`;
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) return `${q.id}: correct answer index is out of range.`;
      if (!q.teacherExplanation?.trim() || !q.revealTrick?.trim()) return `${q.id}: teacher explanation and reveal-the-trick are required.`;
    }
  }
  return null;
}

/** Publish an edition: overwrites `current` and snapshots it under its version. */
export async function POST(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
  try {
    const body = await request.text();
    if (body.length > 200_000) return NextResponse.json({ error: 'Content too large.' }, { status: 413 });
    const { content } = JSON.parse(body) as { content?: unknown };
    const problem = validateContent(content);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const toSave: SkimContent = { ...(content as SkimContent), updatedAt: Date.now(), updatedBy: auth.uid };
    const col = adminDb.collection(SKIM_CONTENT_COL);
    // `current` is what the app serves; a per-version snapshot keeps an audit trail.
    await col.doc('current').set(toSave);
    await col.doc(toSave.version).set(toSave, { merge: true });
    return NextResponse.json({ ok: true, version: toSave.version }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Could not save content.' }, { status: 400 });
  }
}
