import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyStaff } from '@/lib/api-auth';
import {
  col, getSettings, lecturerFromDoc, bookingOut, addAvailability, removeAvailability, futureAvailability,
  payoutSummary, bookingSummaryHtml, mailQuiet, mailAll,
} from '@/lib/one-to-one-server';
import { parseHHMM, DEFAULT_SETTINGS, type OtoMode } from '@/lib/one-to-one';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const str = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max);
const num = (v: unknown) => Math.max(0, Number(v) || 0);

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const medicalId = request.nextUrl.searchParams.get('medical');
  if (medicalId) {
    const m = (await col.medical().doc(medicalId).get()).data();
    return m ? NextResponse.json({ file: m.file, note: m.note }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [lecSnap, privSnap, bookSnap, settings, payouts] = await Promise.all([
    col.lecturers().get(), col.private().get(), col.bookings().get(), getSettings(), payoutSummary(),
  ]);
  const priv = new Map(privSnap.docs.map(d => [d.id, d.data()]));
  const lecturers = await Promise.all(lecSnap.docs.map(async d => {
    const p = priv.get(d.id) ?? {};
    return { ...lecturerFromDoc(d), uid: d.data().uid ?? '', linkedEmail: d.data().linkedEmail ?? '',
      payRate: p.payRate ?? 0, zoomLink: p.zoomLink ?? '', phone: p.phone ?? '', email: p.email ?? '', availability: await futureAvailability(d.id) };
  }));
  const now = Date.now();
  // shortcut: returns every booking; page by date once there are thousands.
  const bookings = bookSnap.docs.map(d => bookingOut(d.id, d.data()))
    .filter(b => b.status !== 'expired' && !(b.status === 'held' && Number(bookSnap.docs.find(d => d.id === b.id)!.data().holdUntil) < now))
    .sort((a, b) => b.startAt - a.startAt);
  return NextResponse.json({ lecturers: lecturers.sort((a, b) => a.name.localeCompare(b.name)), bookings, settings, payouts, now });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
  const now = Date.now();
  const by = auth.uid;

  switch (body.action) {
    case 'saveLecturer': {
      const name = str(body.name, 120);
      if (!name) return fail('Name is required.');
      const modes = (Array.isArray(body.modes) ? body.modes : []).filter((m: string) => m === 'online' || m === 'physical') as OtoMode[];
      if (!modes.length) return fail('Choose at least one session type.');
      const ref = body.id ? col.lecturers().doc(str(body.id)) : col.lecturers().doc();
      const pub: Record<string, unknown> = {
        name, title: str(body.title, 160), bio: str(body.bio), photoUrl: str(body.photoUrl, 600),
        subjects: (Array.isArray(body.subjects) ? body.subjects : []).map((s: unknown) => str(s, 40)).filter(Boolean),
        modes, priceOnline: num(body.priceOnline), pricePhysical: num(body.pricePhysical), active: body.active !== false, updatedAt: now,
      };
      const email = str(body.linkEmail, 200).toLowerCase();
      if (email) {
        const u = await adminDb.collection('users').where('email', '==', email).limit(1).get();
        if (u.empty) return fail(`No SmartLabs account uses ${email}. Ask the lecturer to sign up first.`);
        const clash = await col.lecturers().where('uid', '==', u.docs[0].id).limit(1).get();
        if (!clash.empty && clash.docs[0].id !== ref.id) return fail('That account is already linked to another lecturer.');
        Object.assign(pub, { uid: u.docs[0].id, linkedEmail: email });
      } else Object.assign(pub, { uid: '', linkedEmail: '' });
      const zoom = str(body.zoomLink, 600);
      if (zoom && !/^https:\/\//.test(zoom)) return fail('Zoom link must start with https://');
      await ref.set(pub, { merge: true });
      await col.private().doc(ref.id).set({ payRate: num(body.payRate), zoomLink: zoom, phone: str(body.phone, 40), email: str(body.email, 200).toLowerCase() }, { merge: true });
      return NextResponse.json({ ok: true, id: ref.id });
    }

    case 'addAvailability': {
      const err = await addAvailability(str(body.lecturerId), str(body.date), str(body.start), str(body.end), Number(body.repeatWeeks));
      return err ? fail(err) : NextResponse.json({ ok: true });
    }
    case 'removeAvailability': {
      const err = await removeAvailability(str(body.lecturerId), str(body.id));
      return err ? fail(err) : NextResponse.json({ ok: true });
    }

    case 'saveSettings': {
      const s = body.settings ?? {};
      const clamp = (v: unknown, lo: number, hi: number, d: number) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || d));
      const fallbackZoom = str(s.fallbackZoom, 600);
      if (fallbackZoom && !/^https:\/\//.test(fallbackZoom)) return fail('Zoom link must start with https://');
      await col.settings().set({
        stepMin: clamp(s.stepMin, 5, 60, DEFAULT_SETTINGS.stepMin),
        cooldownMin: clamp(s.cooldownMin, 0, 120, DEFAULT_SETTINGS.cooldownMin),
        holdMin: clamp(s.holdMin, 5, 60, DEFAULT_SETTINGS.holdMin),
        minNoticeHours: clamp(s.minNoticeHours, 0, 72, DEFAULT_SETTINGS.minNoticeHours),
        daysAhead: clamp(s.daysAhead, 7, 120, DEFAULT_SETTINGS.daysAhead),
        address: str(s.address, 300) || DEFAULT_SETTINGS.address, fallbackZoom,
      }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    case 'markPaid': { // key = `${lecturerId}_${YYYY-MM}`; records the running total paid for that month
      const key = str(body.key, 200);
      const [lecturerId, month] = key.split('_');
      if (!lecturerId || !/^\d{4}-\d{2}$/.test(month ?? '')) return fail('Invalid payout.');
      await col.payouts().doc(key).set({ lecturerId, month, paidAmount: num(body.paidAmount), ref: str(body.ref, 200), paidAt: now, by }, { merge: true });
      return NextResponse.json({ ok: true });
    }
  }

  // Booking actions.
  const ref = col.bookings().doc(str(body.id) || '-');
  const b = (await ref.get()).data();
  if (!b) return fail('Booking not found.', 404);

  switch (body.action) {
    case 'cancelBooking': { // SmartLabs / lecturer cancels → always a full refund
      if (b.status !== 'confirmed') return fail('Only confirmed bookings can be cancelled.');
      const reason = str(body.reason, 500) || 'Cancelled by SmartLabs';
      await ref.update({ status: 'cancelled', cancel: { at: now, by: 'admin', uid: by, reason }, refund: { status: 'pending', amount: b.price, band: 'full' } });
      await mailAll(b, 'One-to-one session cancelled', 'Session cancelled by SmartLabs', {
        student: `Hi ${b.studentName}, we are sorry — your session had to be cancelled (${reason}). You will receive a full refund. You are welcome to book another time.`,
        lecturer: `This session was cancelled by SmartLabs (${reason}).`,
        admin: `Cancelled by staff (${reason}). Refund LKR ${b.price} is pending — refund in PayHere, then mark it refunded.`,
      });
      return NextResponse.json({ ok: true });
    }
    case 'confirmCompleted': {
      if (!['confirmed', 'no_show'].includes(b.status)) return fail('Only confirmed sessions can be marked completed.');
      if (now < b.startAt) return fail('This session has not started yet.');
      const s = parseHHMM(str(body.actualStart)), e = parseHHMM(str(body.actualEnd));
      if (isNaN(s) || isNaN(e) || e <= s) return fail('Enter the actual start and end time (e.g. 09:00 and 10:00).');
      const payRate = Number((await col.private().doc(b.lecturerId).get()).data()?.payRate) || 0;
      // Lecturer pay = booked hours × their hourly pay (decided 2026-11-21); actual times are kept for the record.
      await ref.update({
        status: 'completed', payRate, payAmount: payRate * Number(b.hours),
        completion: { actualStartMin: s, actualEndMin: e, actualMinutes: e - s, note: str(body.note, 500), by, at: now },
      });
      return NextResponse.json({ ok: true });
    }
    case 'markNoShow': {
      if (b.status !== 'confirmed' || now < b.startAt) return fail('Only a confirmed session that has started can be marked as a no-show.');
      await ref.update({ status: 'no_show', noShow: { by, at: now } });
      return NextResponse.json({ ok: true });
    }
    case 'reviewMedical': {
      if (b.medical?.status !== 'submitted') return fail('No medical certificate waiting for review.');
      const approve = body.approve === true;
      await ref.update({
        medical: { ...b.medical, status: approve ? 'approved' : 'rejected', reviewedBy: by, reviewedAt: now, reviewNote: str(body.note, 500) },
        ...(approve && b.refund?.status !== 'refunded' ? { refund: { status: 'pending', amount: b.price, band: 'medical' } } : {}),
      });
      await mailQuiet(b.studentEmail, `Medical certificate ${approve ? 'approved' : 'not approved'}`, bookingSummaryHtml(b,
        approve ? 'Medical certificate approved' : 'Medical certificate not approved',
        approve ? 'Your medical certificate was approved. A full refund will be returned to your original payment method within 7–14 working days.'
          : `We could not approve your medical certificate. ${str(body.note, 500)}`));
      return NextResponse.json({ ok: true });
    }
    case 'markRefund': { // after refunding in the PayHere portal, or granting course credit
      const kind = body.kind === 'credit' ? 'credit' : 'refunded';
      if (b.status !== 'cancelled' && b.status !== 'no_show') return fail('Only cancelled or missed sessions can be refunded.');
      await ref.update({ refund: { ...(b.refund ?? {}), status: kind, amount: num(body.amount), note: str(body.note, 500), by, at: now } });
      return NextResponse.json({ ok: true });
    }
  }
  return fail('Unknown action');
}
