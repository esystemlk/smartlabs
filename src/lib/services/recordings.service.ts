import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { ClassRecording, RecordingAccess } from '@/types/recording';

const RECORDINGS = 'class_recordings';
const ACCESS = 'recording_access';

/** How many recent months of recordings stay purchasable. */
const CATALOG_MONTHS = 2;

// ─── Recordings (admin-managed) ─────────────────────────────────────────────

export async function listRecordings(onlyPublished = false): Promise<ClassRecording[]> {
  const snap = await getDocs(collection(db, RECORDINGS));
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ClassRecording, 'id'>) }));
  if (onlyPublished) items = items.filter(r => r.published !== false);
  // Newest class first (month desc, then class number desc).
  items.sort((a, b) =>
    a.month === b.month ? b.classNumber - a.classNumber : b.month.localeCompare(a.month)
  );
  return items;
}

export async function getRecording(id: string): Promise<ClassRecording | null> {
  const snap = await getDoc(doc(db, RECORDINGS, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ClassRecording, 'id'>) }) : null;
}

export async function addRecording(data: Omit<ClassRecording, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, RECORDINGS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecording(id: string, data: Partial<ClassRecording>) {
  await updateDoc(doc(db, RECORDINGS, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRecording(id: string) {
  await deleteDoc(doc(db, RECORDINGS, id));
}

/**
 * The rolling purchase window: the two most recent months that have recordings.
 * In practice that surfaces last month's two classes plus the prior month's
 * classes — matching how recordings go on sale 2–4 weeks after each live class.
 */
export function catalogWindow(all: ClassRecording[]): ClassRecording[] {
  const months = [...new Set(all.map(r => r.month))].sort((a, b) => b.localeCompare(a));
  const keep = new Set(months.slice(0, CATALOG_MONTHS));
  return all.filter(r => keep.has(r.month));
}

// ─── Access (student-facing reads; writes are server-side) ──────────────────

export async function getMyAccess(userId: string): Promise<RecordingAccess[]> {
  const q = query(collection(db, ACCESS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordingAccess, 'id'>) }));
}

/** True when the access row is active and not past its expiry date. */
export function isAccessValid(a: RecordingAccess | undefined | null): boolean {
  if (!a || a.status !== 'active') return false;
  const exp = (a.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.();
  return !exp || exp > new Date();
}

export function accessExpiryDate(a: RecordingAccess): Date | null {
  return (a.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
}

export function daysLeft(a: RecordingAccess): number {
  const exp = accessExpiryDate(a);
  if (!exp) return 0;
  return Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 86400000));
}

// ─── Admin access management ───────────────────────────────────────────────

export async function listAllAccess(): Promise<RecordingAccess[]> {
  const snap = await getDocs(collection(db, ACCESS));
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordingAccess, 'id'>) }));
  items.sort((a, b) => {
    const ta = (a.purchasedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const tb = (b.purchasedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return items;
}
