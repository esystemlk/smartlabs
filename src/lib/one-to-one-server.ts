import { adminDb } from '@/lib/firebase-admin';
import { sendMail } from '@/lib/mail';
import { addDays, colomboDate, DEFAULT_SETTINGS, fmtTime, lkr, parseHHMM, type OtoLecturer, type OtoSettings, type Range } from '@/lib/one-to-one';

// Every oto_* collection is server-only (Firestore default-deny); clients go through /api/one-to-one/*.
export const col = {
  lecturers: () => adminDb!.collection('oto_lecturers'),
  private: () => adminDb!.collection('oto_lecturer_private'), // payRate, zoomLink, phone
  availability: () => adminDb!.collection('oto_availability'),
  bookings: () => adminDb!.collection('oto_bookings'),
  payouts: () => adminDb!.collection('oto_payouts'),
  medical: () => adminDb!.collection('oto_medical'),
  settings: () => adminDb!.collection('oto_settings').doc('main'),
};

export const ADMIN_ALERT = 'contact@smartlabs.lk';

export async function getSettings(): Promise<OtoSettings & { fallbackZoom?: string }> {
  const snap = await col.settings().get();
  return { ...DEFAULT_SETTINGS, ...(snap.data() ?? {}) } as OtoSettings & { fallbackZoom?: string };
}

export function lecturerFromDoc(d: FirebaseFirestore.DocumentSnapshot): OtoLecturer {
  const x = d.data() ?? {};
  return {
    id: d.id, name: x.name ?? '', title: x.title ?? '', bio: x.bio ?? '', photoUrl: x.photoUrl ?? '',
    subjects: x.subjects ?? [], modes: x.modes ?? ['online'],
    priceOnline: x.priceOnline ?? 0, pricePhysical: x.pricePhysical ?? 0, active: x.active !== false,
  };
}

/** A booking blocks time while confirmed/completed, or while its payment hold is still open. */
export function blocks(b: FirebaseFirestore.DocumentData, now: number): boolean {
  if (b.status === 'confirmed' || b.status === 'completed' || b.status === 'no_show') return true;
  return b.status === 'held' && Number(b.holdUntil) > now;
}

export function busyFrom(docs: FirebaseFirestore.QueryDocumentSnapshot[], date: string, now: number): Range[] {
  return docs.map(d => d.data()).filter(b => b.date === date && blocks(b, now))
    .map(b => ({ startMin: b.startMin, endMin: b.endMin }));
}

/** The lecturer profile linked to this signed-in account, if any. */
export async function lecturerForUid(uid: string) {
  const snap = await col.lecturers().where('uid', '==', uid).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bookingOut(id: string, b: any) {
  return {
    id, lecturerId: b.lecturerId, lecturerName: b.lecturerName, lecturerPhoto: b.lecturerPhoto ?? '',
    studentUid: b.studentUid, studentName: b.studentName, studentEmail: b.studentEmail, studentPhone: b.studentPhone ?? '',
    mode: b.mode, hours: b.hours, date: b.date, startMin: b.startMin, endMin: b.endMin,
    startAt: b.startAt, endAt: b.endAt, price: b.price, status: b.status, orderId: b.orderId,
    cancel: b.cancel ?? null, refund: b.refund ?? null, medical: b.medical ?? null,
    completion: b.completion ?? null, payAmount: b.payAmount ?? null, createdAt: b.createdAt ?? null,
  };
}

/** Add a window (optionally repeated weekly). Returns an error message or null. */
export async function addAvailability(lecturerId: string, date: string, start: string, end: string, repeatWeeks = 1): Promise<string | null> {
  const s = parseHHMM(start), e = parseHHMM(end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(s) || isNaN(e)) return 'Enter a date and times like 09:00.';
  if (e - s < 60) return 'A window must be at least 1 hour long.';
  if (date < colomboDate(Date.now())) return 'That date is in the past.';
  const weeks = Math.min(Math.max(Math.round(repeatWeeks) || 1, 1), 12);
  const existing = (await col.availability().where('lecturerId', '==', lecturerId).get()).docs.map(d => d.data());
  const batch = adminDb!.batch();
  for (let i = 0; i < weeks; i++) {
    const d = addDays(date, i * 7);
    if (existing.some(x => x.date === d && e > x.startMin && s < x.endMin)) return `This overlaps a window you already have on ${d}.`;
    batch.set(col.availability().doc(), { lecturerId, date: d, startMin: s, endMin: e, createdAt: Date.now() });
  }
  await batch.commit();
  return null;
}

/** Remove a window unless a booking sits inside it. */
export async function removeAvailability(lecturerId: string, id: string): Promise<string | null> {
  const ref = col.availability().doc(id);
  const a = (await ref.get()).data();
  if (!a || a.lecturerId !== lecturerId) return 'Window not found.';
  const booked = await col.bookings().where('lecturerId', '==', lecturerId).where('date', '==', a.date).get();
  const now = Date.now();
  if (booked.docs.some(d => blocks(d.data(), now) && d.data().startMin < a.endMin && d.data().endMin > a.startMin)) {
    return 'A student has booked time inside this window. Ask the admin to move or cancel that booking first.';
  }
  await ref.delete();
  return null;
}

export async function futureAvailability(lecturerId: string) {
  const today = colomboDate(Date.now());
  return (await col.availability().where('lecturerId', '==', lecturerId).get()).docs
    .map(d => ({ id: d.id, lecturerId, date: d.data().date as string, startMin: d.data().startMin as number, endMin: d.data().endMin as number }))
    .filter(a => a.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
}

/** Completed sessions grouped by lecturer + class month, minus what has been paid out. */
export async function payoutSummary(lecturerId?: string) {
  const q = lecturerId ? col.bookings().where('lecturerId', '==', lecturerId) : col.bookings().where('status', '==', 'completed');
  const [done, paid] = await Promise.all([q.get(), lecturerId ? col.payouts().where('lecturerId', '==', lecturerId).get() : col.payouts().get()]);
  const rows = new Map<string, { key: string; lecturerId: string; lecturerName: string; month: string; sessions: number; hours: number; amount: number; paidAmount: number; paidAt?: number; ref?: string }>();
  for (const d of done.docs) {
    const b = d.data();
    if (b.status !== 'completed') continue;
    const month = String(b.date).slice(0, 7), key = `${b.lecturerId}_${month}`;
    const r = rows.get(key) ?? { key, lecturerId: b.lecturerId, lecturerName: b.lecturerName, month, sessions: 0, hours: 0, amount: 0, paidAmount: 0 };
    r.sessions++; r.hours += Number(b.hours) || 0; r.amount += Number(b.payAmount) || 0;
    rows.set(key, r);
  }
  for (const d of paid.docs) {
    const r = rows.get(d.id);
    if (r) Object.assign(r, { paidAmount: Number(d.data().paidAmount) || 0, paidAt: d.data().paidAt, ref: d.data().ref });
  }
  return [...rows.values()].sort((a, b) => b.month.localeCompare(a.month) || a.lecturerName.localeCompare(b.lecturerName));
}

const esc =(s: unknown) => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Audience = 'student' | 'lecturer' | 'admin';

const FOOTER: Record<Audience, (online: boolean) => string> = {
  student: online => `Manage your booking at <a href="https://smartlabs.lk/one-to-one/my-bookings">smartlabs.lk/one-to-one/my-bookings</a>.${online ? ' Your Zoom link appears there 30 minutes before the session.' : ''}`,
  lecturer: online => `See your sessions at <a href="https://smartlabs.lk/one-to-one/lecturer">smartlabs.lk/one-to-one/lecturer</a>.${online ? ' Your Zoom button appears there 30 minutes before the session.' : ''}`,
  admin: () => `Open <a href="https://smartlabs.lk/admin/dashboard/one-to-one">Admin → One-to-One Sessions</a>.`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bookingSummaryHtml(b: any, heading: string, note: string, audience: Audience = 'student') {
  const when = `${new Date(b.startAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${fmtTime(b.startMin)} – ${fmtTime(b.endMin)}`;
  const row = (k: string, v: string) => `<tr><td style="padding:6px 0;color:#6b7280;width:38%">${k}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f4f5f7">
  <div style="background:#0D1B35;color:#F5D978;padding:18px 22px;border-radius:12px 12px 0 0;font-size:18px;font-weight:bold">${esc(heading)}</div>
  <div style="background:#fff;padding:22px;border-radius:0 0 12px 12px;font-size:14px;color:#111827">
  <p>${esc(note)}</p><table style="width:100%;border-collapse:collapse">
  ${row('Lecturer', b.lecturerName)}${row('Student', b.studentName)}${audience !== 'student' && b.studentPhone ? row('Student phone', b.studentPhone) : ''}${row('When', when)}
  ${row('Length', `${b.hours} hour${b.hours > 1 ? 's' : ''}`)}${row('Mode', b.mode === 'online' ? 'Online (Zoom)' : 'Physical class')}
  ${audience !== 'lecturer' ? row('Amount', lkr(b.price)) : ''}</table>
  <p style="margin-top:16px">${FOOTER[audience](b.mode === 'online')}</p></div></div>`;
}

/** The lecturer's email: their linked login, else the private contact email. */
export async function lecturerEmail(lecturerId: string): Promise<string | undefined> {
  const [pub, priv] = await Promise.all([col.lecturers().doc(lecturerId).get(), col.private().doc(lecturerId).get()]);
  return (pub.data()?.linkedEmail || priv.data()?.email || undefined) as string | undefined;
}

/** Send one message to student, lecturer and admin, each with their own footer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mailAll(b: any, subject: string, heading: string, notes: Record<Audience, string>) {
  const lec = await lecturerEmail(b.lecturerId);
  await Promise.all([
    mailQuiet(b.studentEmail, subject, bookingSummaryHtml(b, heading, notes.student, 'student')),
    mailQuiet(lec, subject, bookingSummaryHtml(b, heading, notes.lecturer, 'lecturer')),
    mailQuiet(ADMIN_ALERT, `${subject} — ${b.studentName} / ${b.lecturerName}`, bookingSummaryHtml(b, heading, notes.admin, 'admin')),
  ]);
}

/** Best-effort email; never throws. */
export async function mailQuiet(to: string | undefined, subject: string, html: string) {
  if (!to) return;
  try { await sendMail({ to, subject, html }); } catch (e) { console.error('[one-to-one] mail failed', e); }
}
