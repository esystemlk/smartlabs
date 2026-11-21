import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { col, bookingOut, bookingSummaryHtml, mailQuiet, lecturerEmail, ADMIN_ALERT } from '@/lib/one-to-one-server';
import { refundBand, REFUND_BAND_TEXT } from '@/lib/one-to-one';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CERT_CHARS = 900_000; // data URL inside one Firestore doc (1 MiB limit)
const MEDICAL_WINDOW_MS = 48 * 3_600_000;

/** Student: own bookings (paid or awaiting payment). */
export async function GET(request: NextRequest) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const snap = await col.bookings().where('studentUid', '==', auth.uid).get();
  const now = Date.now();
  const bookings = snap.docs.map(d => bookingOut(d.id, d.data()))
    .filter(b => b.status !== 'expired' && !(b.status === 'held' && Number(snap.docs.find(d => d.id === b.id)!.data().holdUntil) < now))
    .sort((a, b) => b.startAt - a.startAt);
  return NextResponse.json({ bookings, now });
}

/**
 * Student actions on own booking:
 *  - cancel { bookingId, confirm?: boolean } → without confirm returns the refund rule that would apply.
 *  - medical { bookingId, note, file } → attach a medical certificate (data URL) for admin review.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const ref = col.bookings().doc(String(body.bookingId ?? '-'));
  const snap = await ref.get();
  const b = snap.data();
  if (!b || b.studentUid !== auth.uid) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  const now = Date.now();

  if (body.action === 'cancel') {
    if (b.status !== 'confirmed') return NextResponse.json({ error: 'Only confirmed upcoming sessions can be cancelled.' }, { status: 400 });
    if (now >= b.startAt) return NextResponse.json({ error: 'This session has already started.' }, { status: 400 });
    const band = refundBand(b.startAt, now);
    const refundAmount = band === 'full' ? b.price : 0;
    if (!body.confirm) return NextResponse.json({ band, refundAmount, message: REFUND_BAND_TEXT[band] });
    await ref.update({
      status: 'cancelled',
      cancel: { at: now, by: 'student', band, reason: String(body.reason ?? '').slice(0, 500) },
      refund: { status: band === 'full' ? 'pending' : 'none', amount: refundAmount, band },
    });
    const after = { ...b, status: 'cancelled' };
    await mailQuiet(ADMIN_ALERT, `One-to-one cancelled (${band === 'full' ? 'REFUND DUE' : 'no refund'}) — ${b.lecturerName}`,
      bookingSummaryHtml(after, 'Booking cancelled by student', `${REFUND_BAND_TEXT[band]} ${band === 'full' ? 'Please refund via PayHere, then mark it refunded.' : ''}`));
    await mailQuiet(b.studentEmail, 'Your one-to-one session was cancelled', bookingSummaryHtml(after, 'Booking cancelled', REFUND_BAND_TEXT[band]));
    await mailQuiet(await lecturerEmail(b.lecturerId), 'One-to-one session cancelled', bookingSummaryHtml(after, 'Session cancelled', `${b.studentName} cancelled this session. The time is free again for other students.`, 'lecturer'));
    return NextResponse.json({ ok: true, band, refundAmount });
  }

  if (body.action === 'medical') {
    if (!['cancelled', 'no_show', 'confirmed'].includes(b.status)) return NextResponse.json({ error: 'A medical certificate cannot be added to this booking.' }, { status: 400 });
    if (b.cancel?.by === 'system' || b.refund?.status === 'refunded') return NextResponse.json({ error: 'This booking is already being refunded.' }, { status: 400 });
    if (now > b.endAt + MEDICAL_WINDOW_MS) return NextResponse.json({ error: 'Medical certificates must be submitted within 48 hours of the session.' }, { status: 400 });
    const file = String(body.file ?? '');
    if (!/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(file)) return NextResponse.json({ error: 'Upload a PNG, JPG, WEBP or PDF file.' }, { status: 400 });
    if (file.length > MAX_CERT_CHARS) return NextResponse.json({ error: 'File is too large. Please keep it under 650 KB.' }, { status: 413 });
    await col.medical().doc(ref.id).set({ bookingId: ref.id, studentUid: auth.uid, file, note: String(body.note ?? '').slice(0, 1000), at: now });
    const update: Record<string, unknown> = { medical: { status: 'submitted', at: now, note: String(body.note ?? '').slice(0, 1000) } };
    if (b.status === 'confirmed') {
      // Medical before the session cancels it (frees the slot); after the start it is a missed session.
      const band = refundBand(b.startAt, now);
      if (now >= b.startAt) update.status = 'no_show';
      else { update.status = 'cancelled'; update.cancel = { at: now, by: 'student', band, reason: 'Medical' }; }
      update.refund = { status: 'none', amount: 0, band };
    }
    await ref.update(update);
    if (update.status === 'cancelled') await mailQuiet(await lecturerEmail(b.lecturerId), 'One-to-one session cancelled', bookingSummaryHtml(b, 'Session cancelled', `${b.studentName} cancelled this session for medical reasons. The time is free again for other students.`, 'lecturer'));
    await mailQuiet(ADMIN_ALERT, `Medical certificate to review — ${b.studentName}`, bookingSummaryHtml(b, 'Medical certificate submitted', 'Review it in Admin → One-to-One → Refunds & medical.'));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
