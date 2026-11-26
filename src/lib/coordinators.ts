// Shared (client + server) rules for the coordinator enrolment tracker.

/** Private, unlinked page for coordinators and developers. */
export const COORD_PATH = '/team-desk-7q4x';
export const DEFAULT_COORDINATORS = ['oshadi@smartlabs.lk', 'zainab@smartlabs.lk'];
export const PAYMENT_METHODS = ['Bank transfer', 'Cash', 'Card', 'PayHere', 'Other'] as const;

/** Sri Lankan numbers in one form (+947XXXXXXXX) so the same student matches however it was typed. */
export function normalizePhone(raw: string): string {
  const d = String(raw || '').replace(/[^\d+]/g, '');
  let digits = d.replace(/\+/g, '');
  if (digits.startsWith('0094')) digits = digits.slice(2);
  if (digits.startsWith('94') && digits.length === 11) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '+94' + digits.slice(1);
  if (digits.length === 9 && digits.startsWith('7')) return '+94' + digits;
  return d.startsWith('+') ? '+' + digits : digits; // foreign or unusual numbers: keep the digits as typed
}

/** 'YYYY-MM' in Sri Lanka time. */
export function monthOf(ms: number): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit' }).formatToParts(new Date(ms));
  return `${p.find(x => x.type === 'year')!.value}-${p.find(x => x.type === 'month')!.value}`;
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

export interface CoordEntry {
  id: string;
  coordinatorUid: string;
  coordinatorEmail: string;
  coordinatorName: string;
  name: string;
  phone: string;
  email: string;
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
  fee: number;
  paid: number;
  method: string;
  paidOn: string;
  note: string;
  slipPath: string;
  month: string;
  createdAt: number;
  unlocked?: boolean;
  dupDecision?: 'credit' | 'no-credit' | null;
  // Developer view only:
  duplicate?: boolean;
  counts?: boolean;
}

/**
 * Marks entries whose phone number was also entered by a different coordinator. Such entries count
 * toward a coordinator only after the developer picks them ("credit"); everything else counts.
 */
export function markDuplicates<T extends Pick<CoordEntry, 'phone' | 'coordinatorUid' | 'dupDecision'>>(entries: T[], allEntries: T[] = entries): (T & { duplicate: boolean; counts: boolean })[] {
  const owners = new Map<string, Set<string>>();
  for (const e of allEntries) {
    if (!e.phone) continue;
    if (!owners.has(e.phone)) owners.set(e.phone, new Set());
    owners.get(e.phone)!.add(e.coordinatorUid);
  }
  return entries.map(e => {
    const duplicate = !!e.phone && (owners.get(e.phone)?.size ?? 0) > 1;
    return { ...e, duplicate, counts: !duplicate || e.dupDecision === 'credit' };
  });
}

export interface CoordSummaryRow { coordinator: string; email: string; students: number; flagged: number; fees: number; paid: number; balance: number }

export function summarize(entries: (CoordEntry & { counts: boolean; duplicate: boolean })[]): CoordSummaryRow[] {
  const by = new Map<string, CoordSummaryRow>();
  for (const e of entries) {
    const r = by.get(e.coordinatorUid) ?? { coordinator: e.coordinatorName || e.coordinatorEmail, email: e.coordinatorEmail, students: 0, flagged: 0, fees: 0, paid: 0, balance: 0 };
    if (e.duplicate && !e.dupDecision) r.flagged++;
    if (e.counts) { r.students++; r.fees += e.fee; r.paid += e.paid; r.balance += Math.max(0, e.fee - e.paid); }
    by.set(e.coordinatorUid, r);
  }
  return [...by.values()].sort((a, b) => b.students - a.students);
}

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Excel-friendly CSV: a summary block, then every student row. */
export function reportCsv(month: string, entries: (CoordEntry & { counts: boolean; duplicate: boolean })[], slipLink: (e: CoordEntry) => string = () => ''): string {
  const rows: unknown[][] = [[`Smart Labs coordinator report`, month], [], ['Coordinator', 'Email', 'Students counted', 'Duplicates waiting for a decision', 'Total fees (LKR)', 'Total paid (LKR)', 'Balance due (LKR)']];
  for (const r of summarize(entries)) rows.push([r.coordinator, r.email, r.students, r.flagged, r.fees, r.paid, r.balance]);
  rows.push([], ['Coordinator', 'Student name', 'Contact number', 'Email', 'Course', 'Batch', 'Fee (LKR)', 'Paid (LKR)', 'Balance (LKR)', 'Payment method', 'Paid on', 'Counted', 'Duplicate', 'Note', 'Slip']);
  for (const e of [...entries].sort((a, b) => a.coordinatorName.localeCompare(b.coordinatorName) || a.createdAt - b.createdAt)) {
    rows.push([e.coordinatorName || e.coordinatorEmail, e.name, e.phone, e.email, e.courseName, e.batchName, e.fee, e.paid, Math.max(0, e.fee - e.paid), e.method, e.paidOn, e.counts ? 'Yes' : 'No', e.duplicate ? (e.dupDecision === 'credit' ? 'Yes (credited)' : e.dupDecision === 'no-credit' ? 'Yes (not credited)' : 'Yes (needs decision)') : '', e.note, slipLink(e)]);
  }
  // BOM so Excel opens it as UTF-8.
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}
