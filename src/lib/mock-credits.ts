import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { FREE_MOCK_LIMIT } from '@/lib/mock-packages';

export { MOCK_PRICE, FREE_MOCK_LIMIT, MOCK_PACKAGES } from '@/lib/mock-packages';

/**
 * Mock-exam credits — a pool of its own, separate from the essay/SWT/SST
 * trainer pools.
 *
 * Forward-looking: a future bundle subscription only needs to set
 * `bundleExpiry` on the user document, and this check (plus the same three
 * lines added to the trainer scorers) will honour it everywhere.
 */


const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);


export type MockCreditCheck =
  | { ok: true; unlimited: boolean; remaining: number }
  | { ok: false; status: number; code: string; message: string; remaining: number };

/** Reads a user's mock-credit position without changing anything. */
export async function getMockCredits(uid: string) {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';

  const staffUnlimited = UNLIMITED_ROLES.has(role);

  const mockExpiry = d.mockMonthlyExpiry?.toDate?.() ?? null;
  const hasMockPlan = !!(mockExpiry && mockExpiry > new Date());

  // Future all-access bundle — one field unlocks mocks and every AI trainer.
  const bundleExpiry = d.bundleExpiry?.toDate?.() ?? null;
  const hasBundle = !!(bundleExpiry && bundleExpiry > new Date());

  const paid = (d.mockPaidCredits as number) ?? 0;
  const freeUsed = (d.mockFreeUsed as number) ?? 0;
  const freeLeft = Math.max(0, FREE_MOCK_LIMIT - freeUsed);

  const unlimited = staffUnlimited || hasMockPlan || hasBundle;

  return { role, unlimited, paid, freeLeft, remaining: unlimited ? -1 : paid + freeLeft };
}

/** Gate before starting a mock. Credit is spent at start, not at scoring. */
export async function verifyMockCredit(uid: string): Promise<MockCreditCheck> {
  const c = await getMockCredits(uid);
  if (c.unlimited) return { ok: true, unlimited: true, remaining: -1 };
  if (c.remaining > 0) return { ok: true, unlimited: false, remaining: c.remaining };

  return {
    ok: false,
    status: 402,
    code: 'NO_MOCK_CREDITS',
    message: 'You need a mock test credit to start this exam.',
    remaining: 0,
  };
}

/**
 * Spends one mock credit. Called once, when the attempt is created — so a
 * student cannot start ten exams on one credit, and a scoring failure never
 * costs them a second credit.
 */
export async function deductMockCredit(uid: string): Promise<void> {
  const ref = adminDb!.collection('users').doc(uid);
  const c = await getMockCredits(uid);
  if (c.unlimited) return;
  if (c.paid > 0) await ref.update({ mockPaidCredits: FieldValue.increment(-1) });
  else await ref.update({ mockFreeUsed: FieldValue.increment(1) });
}

/** Refund — used if attempt creation fails after the credit was taken. */
export async function refundMockCredit(uid: string): Promise<void> {
  const ref = adminDb!.collection('users').doc(uid);
  try {
    await ref.update({ mockPaidCredits: FieldValue.increment(1) });
  } catch { /* best effort */ }
}
