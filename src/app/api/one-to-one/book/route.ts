import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { payhereCreds } from '@/lib/payhere-creds';
import { col, getSettings, busyFrom, lecturerFromDoc } from '@/lib/one-to-one-server';
import { colomboDate, colomboMin, freeStarts, HOUR_OPTIONS, priceFor, toEpoch, fmtTime, type OtoMode } from '@/lib/one-to-one';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

/** Reserve a slot (held for settings.holdMin) and return PayHere checkout params. */
export async function POST(request: NextRequest) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { lecturerId, mode, hours, date, startMin, agreed, client } = body as {
    lecturerId?: string; mode?: OtoMode; hours?: number; date?: string; startMin?: number; agreed?: boolean; client?: string;
  };
  if (!agreed) return NextResponse.json({ error: 'Please accept the cancellation policy.' }, { status: 400 });
  if (!lecturerId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof startMin !== 'number'
    || !(HOUR_OPTIONS as readonly number[]).includes(Number(hours)) || (mode !== 'online' && mode !== 'physical')) {
    return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
  }

  const { merchantId, merchantSecret } = payhereCreds(client);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!merchantId || !merchantSecret || !appUrl) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });

  const s = await getSettings();
  const userSnap = await adminDb.collection('users').doc(auth.uid).get();
  const u = userSnap.data() ?? {};
  const studentName = String(u.displayName || u.name || 'Student');
  const studentEmail = String(u.email || '');
  const studentPhone = String(u.phone || u.phoneNumber || '');

  const now = Date.now();
  const bookingRef = col.bookings().doc();
  const orderId = `oto_${auth.uid.slice(0, 8)}_${now}`;
  const lecturerRef = col.lecturers().doc(lecturerId);

  let booking: Record<string, unknown>;
  try {
    booking = await adminDb.runTransaction(async tx => {
      const [lecSnap, availSnap, bookSnap] = await Promise.all([
        tx.get(lecturerRef),
        tx.get(col.availability().where('lecturerId', '==', lecturerId).where('date', '==', date)),
        tx.get(col.bookings().where('lecturerId', '==', lecturerId).where('date', '==', date)),
      ]);
      if (!lecSnap.exists) throw new Error('Lecturer not found.');
      const lec = lecturerFromDoc(lecSnap);
      if (!lec.active || !lec.modes.includes(mode)) throw new Error('This lecturer does not offer that session type.');
      const rate = priceFor(lec, mode);
      if (rate <= 0) throw new Error('This session type has no price set yet.');

      const earliest = now + s.minNoticeHours * 3_600_000;
      const ed = colomboDate(earliest);
      const earliestMin = date === ed ? colomboMin(earliest) : date < ed ? 24 * 60 : undefined;
      const windows = availSnap.docs.map(d => ({ startMin: d.data().startMin, endMin: d.data().endMin }));
      const starts = freeStarts(windows, busyFrom(bookSnap.docs, date, now), Number(hours), { stepMin: s.stepMin, cooldownMin: s.cooldownMin, earliestMin });
      if (!starts.includes(startMin)) throw new Error('That time was just taken or is no longer available. Please pick another slot.');

      const endMin = startMin + Number(hours) * 60;
      const b = {
        lecturerId, lecturerName: lec.name, lecturerPhoto: lec.photoUrl ?? '',
        studentUid: auth.uid, studentName, studentEmail, studentPhone,
        mode, hours: Number(hours), date, startMin, endMin,
        startAt: toEpoch(date, startMin), endAt: toEpoch(date, endMin),
        rate, price: rate * Number(hours), status: 'held', holdUntil: now + s.holdMin * 60_000,
        orderId, policyAcceptedAt: now, createdAt: now,
      };
      tx.set(bookingRef, b);
      tx.set(adminDb!.collection('payment_orders').doc(), {
        orderId, userId: auth.uid, type: 'one_to_one', bookingId: bookingRef.id,
        paymentAmount: b.price, paymentStatus: 'pending', createdAt: new Date(),
      });
      return b;
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not reserve that slot.' }, { status: 409 });
  }

  const amount = Number(booking.price).toFixed(2);
  const currency = 'LKR';
  const [firstName, ...rest] = studentName.trim().split(' ');
  const params = {
    merchant_id: merchantId,
    return_url: `${appUrl}/one-to-one/my-bookings?payment=success`,
    cancel_url: `${appUrl}/one-to-one/my-bookings?payment=cancelled`,
    notify_url: `${appUrl}/api/payhere/one-to-one-notify`,
    order_id: orderId,
    items: `One-to-one session — ${booking.lecturerName} — ${date} ${fmtTime(startMin)} (${hours} h)`,
    amount, currency,
    first_name: firstName || 'Student', last_name: rest.join(' ') || '-',
    email: studentEmail || 'noreply@smartlabs.lk', phone: studentPhone || '0000000000',
    address: 'N/A', city: 'Colombo', country: 'Sri Lanka',
    hash: md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`),
  };
  return NextResponse.json({ success: true, params, bookingId: bookingRef.id });
}
