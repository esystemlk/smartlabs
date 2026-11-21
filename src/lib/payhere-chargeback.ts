import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

type DocRef = FirebaseFirestore.DocumentReference;

export type ChargebackGrants = {
  /** users/{uid} credit field -> how many this order granted. */
  credits?: Record<string, number>;
  /** users/{uid} unlimited-plan expiry field and how many days this order granted. */
  monthly?: { field: string; days: number };
  /** Access rows to switch off, when still active and owned by this order. */
  accessRows?: DocRef[];
  /** Batch whose seat this order took. */
  seatRef?: DocRef | null;
};

const DAY = 86_400_000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toMs = (v: any): number => (typeof v === 'number' ? v : v?.toDate?.().getTime() ?? (v instanceof Date ? v.getTime() : 0));

/**
 * Records a PayHere chargeback once and removes what the order granted. Credits
 * stop at zero: any already spent are stored on the order as chargebackUnrecovered.
 */
export async function applyChargeback(
  orderDoc: FirebaseFirestore.QueryDocumentSnapshot,
  orderId: string,
  label: string,
  grants: ChargebackGrants = {},
) {
  const userId = String(orderDoc.data().userId);
  const userRef = adminDb!.collection('users').doc(userId);
  const accessRows = grants.accessRows ?? [];
  let recorded = false;
  let lines: string[] = [];

  try {
    await adminDb!.runTransaction(async tx => {
      recorded = false;
      lines = [];
      const order = (await tx.get(orderDoc.ref)).data();
      if (order?.paymentStatus === 'chargedback') return;

      const user = await tx.get(userRef);
      const rows = await Promise.all(accessRows.map(ref => tx.get(ref)));
      const seat = grants.seatRef ? await tx.get(grants.seatRef) : null;

      recorded = true;
      const unrecovered: Record<string, number> = {};
      // Unpaid orders (failed, amount mismatch) never granted anything.
      if (order?.paymentStatus === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userUpdates: Record<string, any> = {};
        for (const [field, amount] of Object.entries(grants.credits ?? {})) {
          const granted = Number(amount) || 0;
          if (granted <= 0) continue;
          const balance = Math.max(0, Number(user.data()?.[field]) || 0);
          const removed = Math.min(granted, balance);
          userUpdates[field] = balance - removed;
          lines.push(`${field}: removed ${removed} of ${granted}`);
          if (removed < granted) unrecovered[field] = granted - removed;
        }
        if (grants.monthly) {
          const { field, days } = grants.monthly;
          const expiry = toMs(user.data()?.[field]);
          // Plans overwrite the expiry, so a later date came from a newer purchase or staff.
          const fromThisOrder = expiry <= toMs(order.updatedAt) + (days + 1) * DAY;
          if (expiry > Date.now() && fromThisOrder) {
            userUpdates[field] = null;
            lines.push(`${field}: unlimited plan ended`);
          } else if (expiry > Date.now()) {
            lines.push(`${field}: left in place, it runs longer than this order granted. Check it by hand.`);
          }
        }
        if (user.exists && Object.keys(userUpdates).length) tx.update(userRef, userUpdates);

        rows.forEach(row => {
          const data = row.data();
          if (data?.status !== 'active' || data.orderId !== orderId) return;
          tx.update(row.ref, { status: 'chargedback', chargedbackAt: FieldValue.serverTimestamp(), chargebackOrderId: orderId });
          lines.push(`Access removed: ${row.ref.path}`);
        });
        if (seat?.exists) {
          tx.update(seat.ref, { seatsFilled: Math.max(0, (Number(seat.data()?.seatsFilled) || 0) - 1) });
          lines.push('Batch seat released');
        }
      }
      tx.update(orderDoc.ref, { paymentStatus: 'chargedback', chargebackUnrecovered: unrecovered, updatedAt: FieldValue.serverTimestamp() });
    });
  } catch (e) {
    console.error(`[chargeback] automatic removal failed for ${orderId}:`, e);
    recorded = true;
    lines = ['AUTOMATIC REMOVAL FAILED. Nothing was changed, so please remove access by hand.'];
  }
  if (!recorded) return;

  console.warn(`[chargeback] ${label} order=${orderId} user=${userId}: ${lines.join('; ') || 'nothing to remove'}`);
  try {
    await sendMail({
      to: 'contact@smartlabs.lk',
      subject: `Chargeback — ${label} (${orderId})`,
      html: `<p>PayHere reported a chargeback for order <b>${orderId}</b> (${label}), user <b>${userId}</b>.</p>
        <ul>${(lines.length ? lines : ['Nothing to remove: this order had not granted anything.']).map(l => `<li>${l}</li>`).join('')}</ul>
        <p>Credits shown as less than the full amount were already spent and have not been recovered.</p>`,
    });
  } catch (e) { console.error('[chargeback] alert failed:', e); }
}
