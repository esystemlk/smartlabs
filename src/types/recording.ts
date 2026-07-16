/** Class-recording packages (Bunny Stream) and the access students purchase. */

/** One purchasable package = ONE class recording. Each month has 2 classes. */
export interface ClassRecording {
  id?: string;
  /** e.g. "PTE Class 14 — Reading Strategies" */
  title: string;
  description?: string;
  /** Month the live class ran, as "YYYY-MM" — drives the rolling catalog window. */
  month: string;
  /** Which of the month's two classes this is: 1 or 2. */
  classNumber: 1 | 2;
  /** Date the live class was held. */
  classDate: string; // YYYY-MM-DD
  /** Bunny Stream library id (numeric, e.g. "12345"). */
  bunnyLibraryId: string;
  /** Bunny Stream video GUID. */
  bunnyVideoId: string;
  /** Optional runtime shown on the card, e.g. "1h 45m". */
  duration?: string;
  /** Price in LKR before the processing fee. */
  price: number;
  /** Only published recordings can be bought or watched. */
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** A student's purchased access to ONE recording. Expires 1 month after purchase. */
export interface RecordingAccess {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  recordingId: string;
  recordingTitle: string;
  purchasedAt: unknown;
  /** purchasedAt + 1 month. */
  expiresAt: unknown;
  status: 'active' | 'expired' | 'suspended';
  orderId?: string;
  /** What they actually paid, including the processing fee. */
  amountPaid?: number;
  /** Set when an admin grants access manually rather than via PayHere. */
  grantedBy?: string;
}

// ─── Pricing ────────────────────────────────────────────────────────────────
/** Base price of one class recording (LKR). */
export const RECORDING_PRICE = 20000;
/** PayHere processing fee added on top. */
export const PROCESSING_FEE_RATE = 0.0299;
/** Days of access granted per purchase. */
export const ACCESS_DAYS = 30;

/** 20000 → { base: 20000, fee: 598, total: 20598 } */
export function priceBreakdown(base: number = RECORDING_PRICE) {
  const fee = Math.round(base * PROCESSING_FEE_RATE * 100) / 100;
  const total = Math.round((base + fee) * 100) / 100;
  return { base, fee, total };
}

/** Bunny Stream embed URL for the player iframe. */
export function bunnyEmbedUrl(libraryId: string, videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=false`;
}

/** Bunny Stream thumbnail for catalog cards. */
export function bunnyThumbnailUrl(libraryId: string, videoId: string) {
  return `https://vz-${libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}

/** "2026-01" → "January 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
