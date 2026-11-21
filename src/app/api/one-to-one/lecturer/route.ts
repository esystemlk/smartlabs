import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import {
  col, lecturerForUid, lecturerFromDoc, bookingOut, addAvailability, removeAvailability, futureAvailability, payoutSummary,
} from '@/lib/one-to-one-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lecturer access = a signed-in account that admin linked to a lecturer profile.
async function lecturer(request: NextRequest) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  if (!adminDb) return { error: NextResponse.json({ error: 'Server not configured' }, { status: 500 }) };
  const doc = await lecturerForUid(auth.uid);
  if (!doc) return { error: NextResponse.json({ error: 'This account is not linked to a lecturer profile.', code: 'NOT_LECTURER' }, { status: 403 }) };
  return { doc };
}

export async function GET(request: NextRequest) {
  const r = await lecturer(request);
  if ('error' in r) return r.error;
  const id = r.doc.id;
  const [availability, bookings, earnings, priv] = await Promise.all([
    futureAvailability(id),
    col.bookings().where('lecturerId', '==', id).get(),
    payoutSummary(id),
    col.private().doc(id).get(),
  ]);
  const sessions = bookings.docs.map(d => bookingOut(d.id, d.data()))
    .filter(b => ['confirmed', 'completed', 'no_show'].includes(b.status))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ studentEmail, price, ...b }) => b) // lecturers don't see student payment or email
    .sort((a, b) => a.startAt - b.startAt);
  return NextResponse.json({ lecturer: lecturerFromDoc(r.doc), payRate: priv.data()?.payRate ?? 0, availability, sessions, earnings, now: Date.now() });
}

/** add { date, start, end, repeatWeeks } | remove { id } */
export async function POST(request: NextRequest) {
  const r = await lecturer(request);
  if ('error' in r) return r.error;
  const body = await request.json().catch(() => ({}));
  const err = body.action === 'add'
    ? await addAvailability(r.doc.id, String(body.date), String(body.start), String(body.end), Number(body.repeatWeeks))
    : body.action === 'remove' ? await removeAvailability(r.doc.id, String(body.id)) : 'Unknown action';
  return err ? NextResponse.json({ error: err }, { status: 400 }) : NextResponse.json({ ok: true });
}
