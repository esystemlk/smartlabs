/**
 * Recorded-session PACKAGES — admin builds a monthly package and adds the
 * batch's class videos (Bunny Stream) to it. Students buy the package on the
 * website and watch the videos here for `accessMonths`.
 *
 * Distinct from `class_recordings` (the older per-class rolling catalogue):
 * this is a bundle model — one package = many classes, one purchase.
 */

// Re-export the Bunny helpers so consumers have a single import.
export { bunnyEmbedUrl, bunnyThumbnailUrl } from '@/types/recording';

/** A purchasable package = a set of recorded classes (e.g. "January 2026"). */
export interface RecordedPackage {
  id?: string;
  /** e.g. "January 2026 — PTE Recorded Classes" */
  title: string;
  /** Short period/batch label shown as a chip, e.g. "January 2026". */
  periodLabel?: string;
  description?: string;
  /** Bullet features shown on the card + receipt. */
  features?: string[];
  /** Price in LKR (the amount charged — no extra fee added). */
  price: number;
  /** Months of access granted from purchase. */
  accessMonths: number;
  /** Optional cover image URL. Falls back to the first class's Bunny thumbnail. */
  thumbnail?: string;
  /** Only published packages are visible/purchasable. */
  published: boolean;
  /** Sort order (higher = shown first). */
  order?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** One recorded class (video) inside a package. */
export interface RecordedClass {
  id?: string;
  packageId: string;
  title: string;
  bunnyLibraryId: string;
  bunnyVideoId: string;
  /** Optional runtime label, e.g. "1h 45m". */
  duration?: string;
  order: number;
  published: boolean;
  createdAt?: unknown;
}

/** A student's purchased access to ONE package. */
export interface RecordedEnrollment {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  packageId: string;
  packageTitle: string;
  purchasedAt: unknown;
  /** purchasedAt + accessMonths. */
  expiresAt: unknown;
  status: 'active' | 'expired' | 'suspended';
  orderId?: string;
  amountPaid?: number;
  /** Set when an admin grants access manually rather than via PayHere. */
  grantedBy?: string;
}

/** LKR formatter, matching the course pages. */
export const formatLkr = (n: number): string => `LKR ${Number(n || 0).toLocaleString('en-LK')}`;

/** Add whole months to a date (clamps end-of-month). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  return d;
}

/** True when the enrollment is active and not past expiry. */
export function isEnrollmentValid(a: RecordedEnrollment | undefined | null): boolean {
  if (!a || a.status !== 'active') return false;
  const exp = (a.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return !exp || exp > new Date();
}

export function enrollmentExpiry(a: RecordedEnrollment): Date | null {
  return (a.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
}

export function daysLeft(a: RecordedEnrollment): number {
  const exp = enrollmentExpiry(a);
  if (!exp) return 0;
  return Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 86400000));
}
