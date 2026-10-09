import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { FREE_IELTS_MOCK_LIMIT } from '@/lib/ielts-mock-packages';

export { IELTS_MOCK_PRICE, FREE_IELTS_MOCK_LIMIT, IELTS_MOCK_PACKAGES } from '@/lib/ielts-mock-packages';

/**
 * IELTS mock-exam credits — a pool of its own (fields `ieltsMockPaidCredits`,
 * `ieltsMockMonthlyExpiry`, `ieltsMockFreeUsed`), separate from the PTE mock
 * pool and from the per-skill universal/essay pools. One credit = one full
 * IELTS mock (Listening + Reading + Writing).
 */

const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);

export type IeltsMockCreditCheck =
  | { ok: true; unlimited: boolean; remaining: number }
  | { ok: false; status: number; code: string; message: string; remaining: number };

export async function getIeltsMockCredits(uid: string) {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  const staffUnlimited = UNLIMITED_ROLES.has(role);

  const mockExpiry = d.ieltsMockMonthlyExpiry?.toDate?.() ?? null;
  const hasMockPlan = !!(mockExpiry && mockExpiry > new Date());

  const bundleExpiry = d.bundleExpiry?.toDate?.() ?? null;
  const hasBundle = !!(bundleExpiry && bundleExpiry > new Date());

  const paid = (d.ieltsMockPaidCredits as number) ?? 0;
  const freeUsed = (d.ieltsMockFreeUsed as number) ?? 0;
  const freeLeft = Math.max(0, FREE_IELTS_MOCK_LIMIT - freeUsed);

  const unlimited = staffUnlimited || hasMockPlan || hasBundle;
  return { role, unlimited, paid, freeLeft, remaining: unlimited ? -1 : paid + freeLeft };
}

/** Gate before starting a mock. Credit is spent at start, not at scoring. */
export async function verifyIeltsMockCredit(uid: string): Promise<IeltsMockCreditCheck> {
  const c = await getIeltsMockCredits(uid);
  if (c.unlimited) return { ok: true, unlimited: true, remaining: -1 };
  if (c.remaining > 0) return { ok: true, unlimited: false, remaining: c.remaining };
  return { ok: false, status: 402, code: 'NO_IELTS_MOCK_CREDITS', message: 'You need an IELTS mock test credit to start this exam.', remaining: 0 };
}

/** Spends one IELTS mock credit, once, when the attempt is created. */
export async function deductIeltsMockCredit(uid: string): Promise<void> {
  const ref = adminDb!.collection('users').doc(uid);
  const c = await getIeltsMockCredits(uid);
  if (c.unlimited) return;
  if (c.paid > 0) await ref.update({ ieltsMockPaidCredits: FieldValue.increment(-1) });
  else await ref.update({ ieltsMockFreeUsed: FieldValue.increment(1) });
}

/** Refund — used if attempt creation fails after the credit was taken. */
export async function refundIeltsMockCredit(uid: string): Promise<void> {
  const ref = adminDb!.collection('users').doc(uid);
  try { await ref.update({ ieltsMockPaidCredits: FieldValue.increment(1) }); } catch { /* best effort */ }
}
