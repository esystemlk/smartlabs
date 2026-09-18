import { FieldValue } from 'firebase-admin/firestore';

/**
 * Universal AI credits.
 *
 * Every AI-scored part (essay, SWT, SST, speaking, IELTS essay) keeps its own
 * legacy credit pool, but a single UNIVERSAL pool can pay for ALL of them:
 *   - `universalPaidCredits`   — a shared count, decremented one per AI use.
 *   - `universalMonthlyExpiry` — an "unlimited for N days" plan across every part.
 *
 * Spend order for one AI use (so users burn what they already own first):
 *   1. An active monthly plan (the part's own, or universal) → no charge.
 *   2. The part's own paid credits.
 *   3. The part's remaining free-tier allowance.
 *   4. Universal paid credits.
 *
 * This module is the single source of truth so every score route behaves the
 * same. It tolerates both storage shapes in use across the codebase: a Firestore
 * Timestamp/Date (PTE pools) and a raw epoch-ms number (the IELTS pool).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

export interface PoolConfig {
  /** e.g. 'swtPaidCredits' */
  paid: string;
  /** e.g. 'swtMonthlyExpiry' */
  monthly: string;
  /** e.g. 'swtFreeUsed' */
  free: string;
  /** free scorings allowed once a user has begun the free tier (freeUsed >= 1) */
  freeLimit: number;
}

/** True when an expiry value (Timestamp | Date | epoch-ms number) is in the future. */
export function expiryActive(v: unknown): boolean {
  if (v == null) return false;
  let ms = 0;
  if (typeof v === 'number') ms = v;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if (typeof (v as any)?.toDate === 'function') ms = (v as any).toDate().getTime();
  else if (v instanceof Date) ms = v.getTime();
  return ms > Date.now();
}

/** True when the universal pool can cover a use (unlimited plan or paid balance). */
export function universalActive(d: Doc): boolean {
  return expiryActive(d.universalMonthlyExpiry) || ((d.universalPaidCredits as number) ?? 0) > 0;
}

/** Effective free allowance — 0 for accounts that never started the free tier. */
function freeAllowance(d: Doc, pool: PoolConfig): number {
  const freeUsed = (d[pool.free] as number) ?? 0;
  return freeUsed >= 1 ? pool.freeLimit : 0;
}

/**
 * Is the user allowed one AI use for this part (considering the universal pool)?
 * Returns eligibility plus the underlying figures so callers can build messages.
 */
export function hasCreditFor(d: Doc, pool: PoolConfig): boolean {
  if (expiryActive(d[pool.monthly])) return true;
  if (((d[pool.paid] as number) ?? 0) > 0) return true;
  const freeUsed = (d[pool.free] as number) ?? 0;
  if (freeUsed < freeAllowance(d, pool)) return true;
  return universalActive(d);
}

/**
 * The Firestore field update for consuming ONE AI use, or null when nothing
 * should be decremented (an active monthly plan — the part's own or universal).
 * Spend order: part paid → part free tier → universal paid.
 *
 * `d` should be a freshly-read user document (ideally inside the same
 * transaction that applies the returned update).
 */
export function deductionFor(d: Doc, pool: PoolConfig): Record<string, FieldValue> | null {
  // Active subscription (part-specific or universal) → unlimited, no decrement.
  if (expiryActive(d[pool.monthly]) || expiryActive(d.universalMonthlyExpiry)) return null;

  if (((d[pool.paid] as number) ?? 0) > 0) return { [pool.paid]: FieldValue.increment(-1) };

  const freeUsed = (d[pool.free] as number) ?? 0;
  if (freeUsed < freeAllowance(d, pool)) return { [pool.free]: FieldValue.increment(1) };

  if (((d.universalPaidCredits as number) ?? 0) > 0) return { universalPaidCredits: FieldValue.increment(-1) };

  // Eligibility already passed but nothing left to charge (edge) — no-op.
  return null;
}
