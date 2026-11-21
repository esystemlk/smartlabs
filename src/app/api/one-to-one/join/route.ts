import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { col, getSettings } from '@/lib/one-to-one-server';
import { JOIN_EARLY_MIN } from '@/lib/one-to-one';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The Zoom link (or class address) for a booking — only to its student, its lecturer
 * or staff, and only from 30 minutes before the start until the session ends.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const snap = await col.bookings().doc(request.nextUrl.searchParams.get('booking') ?? '-').get();
  const b = snap.data();
  if (!b) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  const staff = ['admin', 'developer', 'teacher'].includes(auth.role);
  let allowed = staff || b.studentUid === auth.uid;
  if (!allowed) allowed = (await col.lecturers().doc(b.lecturerId).get()).data()?.uid === auth.uid;
  if (!allowed) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (b.status !== 'confirmed') return NextResponse.json({ error: 'This session is not active.' }, { status: 400 });

  const now = Date.now();
  const opensAt = b.startAt - JOIN_EARLY_MIN * 60_000;
  if (now < opensAt) return NextResponse.json({ open: false, opensAt });
  if (now > b.endAt) return NextResponse.json({ open: false, ended: true });

  const s = await getSettings();
  if (b.mode === 'physical') return NextResponse.json({ open: true, mode: 'physical', address: s.address });
  const link = (await col.private().doc(b.lecturerId).get()).data()?.zoomLink || s.fallbackZoom || '';
  if (!link) return NextResponse.json({ open: true, mode: 'online', link: '', message: 'The Zoom link has not been set yet. Please contact SmartLabs.' });
  return NextResponse.json({ open: true, mode: 'online', link });
}
