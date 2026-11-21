// One-to-one sessions: shared types and pure logic (used by API routes and pages).
// All clock times are Sri Lanka local minutes-from-midnight (UTC+05:30, no DST).

export type OtoMode = 'online' | 'physical';
export type OtoStatus = 'held' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'expired';
export type RefundBand = 'full' | 'late' | 'none';

export interface OtoLecturer {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
  subjects: string[];
  modes: OtoMode[];
  priceOnline?: number;   // LKR per hour charged to the student
  pricePhysical?: number;
  active: boolean;
}

export interface OtoSettings {
  stepMin: number;        // start times every N minutes
  cooldownMin: number;    // gap kept free before/after every booking
  holdMin: number;        // how long a slot stays reserved while paying
  minNoticeHours: number; // earliest bookable start from now
  daysAhead: number;      // how far ahead students can book
  address: string;        // physical class location
}

export const DEFAULT_SETTINGS: OtoSettings = {
  stepMin: 30, cooldownMin: 30, holdMin: 15, minNoticeHours: 2, daysAhead: 30,
  address: 'SmartLabs, Sri Lanka',
};

export const HOUR_OPTIONS = [1, 2, 3] as const;
export const JOIN_EARLY_MIN = 30;
const OFFSET_MIN = 330; // Asia/Colombo
const DAY_MS = 86_400_000;

export interface Range { startMin: number; endMin: number }

/** Colombo date + minutes → UTC epoch ms. */
export function toEpoch(date: string, min: number): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) + (min - OFFSET_MIN) * 60_000;
}

/** UTC epoch ms → Colombo YYYY-MM-DD. */
export function colomboDate(ms: number): string {
  return new Date(ms + OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

/** Minutes since Colombo midnight for an epoch. */
export function colomboMin(ms: number): number {
  const d = new Date(ms + OFFSET_MIN * 60_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function addDays(date: string, n: number): string {
  return colomboDate(toEpoch(date, 0) + n * DAY_MS);
}

export function fmtTime(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "HH:MM" → minutes, or NaN. */
export function parseHHMM(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return NaN;
  const h = Number(m[1]), mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : NaN;
}

/**
 * Start times (minutes) a session of `hours` can begin on one day.
 * A start fits when it lies on the step grid of an availability window, the session
 * ends inside that window, it is not before `earliestMin`, and it stays `cooldown`
 * minutes clear of every busy range on both sides.
 */
export function freeStarts(
  windows: Range[], busy: Range[], hours: number,
  opts: { stepMin: number; cooldownMin: number; earliestMin?: number },
): number[] {
  const dur = hours * 60;
  const out = new Set<number>();
  for (const w of windows) {
    for (let s = w.startMin; s + dur <= w.endMin; s += opts.stepMin) {
      if (opts.earliestMin !== undefined && s < opts.earliestMin) continue;
      const e = s + dur;
      const clash = busy.some(b => e + opts.cooldownMin > b.startMin && s < b.endMin + opts.cooldownMin);
      if (!clash) out.add(s);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Which refund rule applies if the student cancels at `nowMs`.
 * full: 3+ days (72 h) before start. none: on the class day or later. late: in between.
 */
export function refundBand(startMs: number, nowMs: number): RefundBand {
  if (nowMs >= startMs || colomboDate(nowMs) === colomboDate(startMs)) return 'none';
  return startMs - nowMs >= 3 * DAY_MS ? 'full' : 'late';
}

export const REFUND_BAND_TEXT: Record<RefundBand, string> = {
  full: 'You are cancelling 3 or more days before your session, so you will receive a full refund.',
  late: 'You are cancelling less than 3 days before your session. This booking is non-refundable. SmartLabs may, at its discretion, offer part of the amount as credit toward a course.',
  none: 'You are cancelling on the day of your session. Same-day cancellations are not refunded.',
};

export const POLICY_POINTS = [
  { title: '3 or more days before your session', text: 'Cancel from My bookings and receive a full refund.' },
  { title: 'Less than 3 days before your session', text: 'The booking is non-refundable. At SmartLabs’ discretion, part of the amount may be offered as credit toward a SmartLabs course.' },
  { title: 'On the day of the session, or not attending', text: 'No refund.' },
  { title: 'Medical reasons', text: 'If illness stops you attending, upload a valid medical certificate before or within 48 hours of the session and we will issue a full refund, whatever the timing.' },
];

export const POLICY_INTRO =
  'Our lecturers’ time is reserved exclusively for you, and every booked hour is an hour another student could not book. To keep the schedule fair for everyone, the following applies:';
export const POLICY_OUTRO =
  'Refunds are returned to the original payment method within 7–14 working days. If SmartLabs or the lecturer has to cancel, you will receive a full refund.';

// ── Reminders ────────────────────────────────────────────────────────────────
export type ReminderKind = 'dayBefore' | 'classDay' | 'hourBefore' | 'starting';
export const REMINDER_ORDER: ReminderKind[] = ['dayBefore', 'classDay', 'hourBefore', 'starting'];
const DAY_BEFORE_AT = 18 * 60; // 6:00 PM the evening before
const CLASS_DAY_AT = 7 * 60;   // 7:00 AM on the class day

/** When each reminder becomes due (epoch ms). */
export function reminderTimes(date: string, startAt: number): Record<ReminderKind, number> {
  return {
    dayBefore: toEpoch(addDays(date, -1), DAY_BEFORE_AT),
    classDay: Math.min(toEpoch(date, CLASS_DAY_AT), startAt - 2 * 3_600_000),
    hourBefore: startAt - 3_600_000,
    starting: startAt - 5 * 60_000,
  };
}

/**
 * Which reminder to send now. Only the latest due one is sent; earlier ones that were
 * missed (or became due before the booking was paid) are skipped, so nobody gets a stale
 * "tomorrow" email on the class day. Nothing is sent once the session has ended.
 */
export function dueReminder(
  b: { date: string; startAt: number; endAt: number; paidAt?: number },
  done: Partial<Record<ReminderKind, unknown>>,
  now: number,
): { send: ReminderKind | null; skip: ReminderKind[] } {
  if (now >= b.endAt) return { send: null, skip: [] };
  const t = reminderTimes(b.date, b.startAt);
  const due = REMINDER_ORDER.filter(k => now >= t[k]);
  const latest = due[due.length - 1];
  const skip = due.filter(k => k !== latest && !done[k]);
  if (!latest || done[latest]) return { send: null, skip };
  // Booked after this reminder's moment (e.g. booked this morning) → the confirmation email already covers it.
  if (b.paidAt && b.paidAt > t[latest] && latest !== 'starting') return { send: null, skip: [...skip, latest] };
  return { send: latest, skip };
}

export const lkr =(n: number) => 'LKR ' + Math.round(Number(n) || 0).toLocaleString('en-LK');

export function priceFor(l: Pick<OtoLecturer, 'priceOnline' | 'pricePhysical'>, mode: OtoMode): number {
  return Number(mode === 'online' ? l.priceOnline : l.pricePhysical) || 0;
}
