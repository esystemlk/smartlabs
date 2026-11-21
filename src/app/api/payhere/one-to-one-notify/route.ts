import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { verifyPayhereSig } from '@/lib/payhere-creds';
import { applyChargeback } from '@/lib/payhere-chargeback';
import { col, blocks, bookingSummaryHtml, mailQuiet, mailAll, ADMIN_ALERT } from '@/lib/one-to-one-server';

// node crypto + firebase-admin.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = Object.fromEntries((await request.formData()).entries());
    const { order_id, payhere_amount, status_code, payment_id } = data;
    if (!verifyPayhereSig(data as Parameters<typeof verifyPayhereSig>[0])) {
      console.warn(`[one-to-one-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK');
    }
    if (!adminDb) return new Response('OK');

    const orders = await adminDb.collection('payment_orders')
      .where('orderId', '==', String(order_id)).where('type', '==', 'one_to_one').limit(1).get();
    if (orders.empty) { console.warn(`[one-to-one-notify] order ${order_id} not found`); return new Response('OK'); }
    const orderDoc = orders.docs[0];
    const order = orderDoc.data();
    if (order.paymentStatus === 'chargedback') return new Response('OK');
    const bookingRef = col.bookings().doc(String(order.bookingId));
    const sc = String(status_code);

    if (sc === '-3') {
      await applyChargeback(orderDoc, String(order_id), 'one-to-one session');
      await bookingRef.update({ status: 'cancelled', cancel: { at: Date.now(), by: 'system', reason: 'chargeback' } });
      return new Response('OK');
    }
    if (order.paymentStatus === 'success') return new Response('OK');

    if (sc === '-1' || sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: sc === '-1' ? 'cancelled' : 'failed', updatedAt: FieldValue.serverTimestamp() });
      await bookingRef.update({ status: 'expired' });
      return new Response('OK');
    }
    if (sc !== '2') return new Response('OK');

    const paid = Number(payhere_amount), expected = Number(order.paymentAmount);
    if (paid < expected - 0.5) {
      console.error(`[one-to-one-notify] UNDERPAYMENT order=${order_id} expected=${expected} paid=${paid}`);
      await orderDoc.ref.update({ paymentStatus: 'amount_mismatch', amountPaid: paid, updatedAt: FieldValue.serverTimestamp() });
      return new Response('OK');
    }

    // Paid after the hold lapsed and someone else took the time → keep the money recorded, refund in full.
    let outcome = 'skip' as 'confirmed' | 'clash' | 'skip';
    await adminDb.runTransaction(async tx => {
      const [fresh, b] = await Promise.all([tx.get(orderDoc.ref), tx.get(bookingRef)]);
      if (['success', 'chargedback'].includes(fresh.data()?.paymentStatus) || !b.exists) return;
      const bk = b.data()!;
      const others = await tx.get(col.bookings().where('lecturerId', '==', bk.lecturerId).where('date', '==', bk.date));
      const now = Date.now();
      const clash = others.docs.some(d => d.id !== b.id && blocks(d.data(), now)
        && bk.endMin > d.data().startMin && bk.startMin < d.data().endMin);
      tx.update(orderDoc.ref, { paymentStatus: 'success', payherePaymentId: String(payment_id), updatedAt: FieldValue.serverTimestamp() });
      if (clash) {
        tx.update(bookingRef, { status: 'cancelled', paidAt: now, cancel: { at: now, by: 'system', reason: 'Slot taken before payment completed' }, refund: { status: 'pending', amount: bk.price, band: 'full' } });
        outcome = 'clash';
      } else {
        tx.update(bookingRef, { status: 'confirmed', paidAt: now });
        outcome = 'confirmed';
      }
    });

    const b = (await bookingRef.get()).data();
    if (b && outcome === 'confirmed') {
      await mailAll(b, 'One-to-one session booked', 'Session confirmed', {
        student: `Hi ${b.studentName}, your one-to-one session is confirmed. We will remind you the day before, on the day, and 1 hour before it starts.`,
        lecturer: `Hi ${b.lecturerName}, a student has booked a one-to-one session with you. Please keep this time free.`,
        admin: `New paid booking. Order ${order_id} · PayHere ${payment_id}.`,
      });
    } else if (b && outcome === 'clash') {
      await mailQuiet(ADMIN_ALERT, `REFUND NEEDED — one-to-one slot clash`, bookingSummaryHtml(b, 'Paid after slot was taken', `Order ${order_id} was paid after its hold expired and the time was booked by someone else. Please refund in full.`));
      await mailQuiet(b.studentEmail, 'Your one-to-one payment will be refunded', bookingSummaryHtml(b, 'Slot no longer available', `Hi ${b.studentName}, the time you chose was booked by another student before your payment completed. You will receive a full refund. Please book another time.`));
    }
    return new Response('OK');
  } catch (error) {
    console.error('[one-to-one-notify] error:', error);
    return new Response('OK');
  }
}
