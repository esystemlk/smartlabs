import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyStaff } from '@/lib/api-auth';
import { ANSWER_REVIEWS, reviewBucket } from '@/lib/server/answer-reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOOLS = new Set(['essay', 'swt', 'sst', 'wfd', 'speaking']);
const signed = (path: string) => reviewBucket().file(path).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 60 * 60 * 1000 }).then(([u]) => u).catch(() => '');

/**
 * Staff only.
 * GET ?tool=&email=&before=<ms>  → newest 30 saved trainer answers (with a 1-hour audio link).
 * GET ?audio=<storage path>       → a 1-hour link for one saved recording (used by the level test report).
 */
export async function GET(request: Request) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);

  const audio = url.searchParams.get('audio');
  if (audio) {
    if (!/^answer-reviews\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(audio)) return NextResponse.json({ error: 'Bad path.' }, { status: 400 });
    return NextResponse.json({ url: await signed(audio) }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const tool = url.searchParams.get('tool') || '';
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const before = Number(url.searchParams.get('before')) || 0;
  // shortcut: filters run in memory over the newest rows (no composite indexes needed); add indexes if this grows past a few thousand a month.
  const col = adminDb!.collection(ANSWER_REVIEWS);
  try {
    let docs: FirebaseFirestore.QueryDocumentSnapshot[];
    let rawFull = false;
    if (email) {
      docs = (await col.where('userEmail', '==', email).limit(300).get()).docs
        .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0));
    } else {
      let q = col.orderBy('createdAt', 'desc');
      if (before) q = q.startAfter(new Date(before));
      const lim = TOOLS.has(tool) ? 300 : 30;
      docs = (await q.limit(lim).get()).docs;
      rawFull = docs.length === lim;
    }
    if (TOOLS.has(tool)) docs = docs.filter(d => d.data().tool === tool);
    if (before && email) docs = docs.filter(d => (d.data().createdAt?.toMillis?.() ?? 0) < before);
    const page = docs.slice(0, 30);
    const more = docs.length > 30 || rawFull;
    const items = await Promise.all(page.map(async d => {
      const r = d.data();
      return {
        id: d.id, tool: r.tool, taskType: r.taskType, userName: r.userName, userEmail: r.userEmail,
        prompt: r.prompt, answer: r.answer, result: r.result, purged: !!r.purged,
        createdAt: r.createdAt?.toMillis?.() ?? 0, expiresAt: r.expiresAt?.toMillis?.() ?? 0,
        audioUrl: r.audioPath ? await signed(r.audioPath) : '',
      };
    }));
    return NextResponse.json({ items, more }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[answer-reviews] list failed:', e);
    return NextResponse.json({ error: 'Could not load answers.' }, { status: 500 });
  }
}
