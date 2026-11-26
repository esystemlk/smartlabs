import 'server-only';
import { getStorage } from 'firebase-admin/storage';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import { DEFAULT_COORDINATORS, markDuplicates, monthOf, type CoordEntry } from '@/lib/coordinators';

/**
 * Coordinator enrolment tracker. Everything goes through these server routes with the Admin SDK,
 * so the collections need no client Firestore rules (clients can't read them directly at all).
 */
export const COURSES = 'coord_courses';
export const ENTRIES = 'coord_entries';
const SETTINGS = () => adminDb!.collection('system_config').doc('coordinators');
export const slipFile = (path: string) => getStorage().bucket(firebaseConfig.storageBucket).file(path);

export interface CoordSettings { coordinatorEmails: string[]; managementEmails: string[] }

export async function getSettings(): Promise<CoordSettings> {
  const d = (await SETTINGS().get()).data();
  return {
    coordinatorEmails: Array.isArray(d?.coordinatorEmails) ? d!.coordinatorEmails : DEFAULT_COORDINATORS,
    managementEmails: Array.isArray(d?.managementEmails) ? d!.managementEmails : [],
  };
}
export const saveSettings = (s: CoordSettings) => SETTINGS().set(s, { merge: true });

export type CoordAccess =
  | { ok: true; uid: string; email: string; name: string; isDev: boolean }
  | { ok: false; status: number; error: string };

/** Coordinators (by email, listed in settings) and developers only. */
export async function coordAccess(request: Request): Promise<CoordAccess> {
  if (!adminDb || !adminAuth) return { ok: false, status: 500, error: 'Server not configured.' };
  const h = request.headers.get('Authorization');
  if (!h?.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Please sign in.' };
  const decoded = await adminAuth.verifyIdToken(h.slice(7)).catch(() => null);
  if (!decoded) return { ok: false, status: 401, error: 'Your session has expired. Please sign in again.' };
  const user = (await adminDb.collection('users').doc(decoded.uid).get()).data();
  const email = String(decoded.email || user?.email || '').toLowerCase();
  const isDev = user?.role === 'developer';
  // Coordinators must have a verified sign-in for their listed email (email+password or Google).
  const isCoord = !!email && (await getSettings()).coordinatorEmails.includes(email);
  if (!isDev && !isCoord) return { ok: false, status: 403, error: 'This page is only for Smart Labs coordinators.' };
  return { ok: true, uid: decoded.uid, email, name: String(user?.displayName || user?.name || decoded.name || email.split('@')[0]), isDev };
}

export function toEntry(id: string, d: FirebaseFirestore.DocumentData): CoordEntry {
  return {
    id, coordinatorUid: d.coordinatorUid, coordinatorEmail: d.coordinatorEmail || '', coordinatorName: d.coordinatorName || '',
    name: d.name || '', phone: d.phone || '', email: d.email || '', courseId: d.courseId || '', courseName: d.courseName || '',
    batchId: d.batchId || '', batchName: d.batchName || '', fee: Number(d.fee) || 0, paid: Number(d.paid) || 0,
    method: d.method || '', paidOn: d.paidOn || '', note: d.note || '', slipPath: d.slipPath || '', month: d.month || '',
    createdAt: d.createdAt?.toMillis?.() ?? 0, unlocked: !!d.unlocked, dupDecision: d.dupDecision ?? null,
  };
}

/** Every entry, with cross-coordinator duplicates marked. shortcut: reads the whole collection; fine for a few thousand rows, page it after that. */
export async function allEntriesMarked() {
  const snap = await adminDb!.collection(ENTRIES).get();
  return markDuplicates(snap.docs.map(d => toEntry(d.id, d.data())));
}

/** Coordinators may change their own entries only while that month is open (or the developer unlocked it). */
export async function editable(a: Extract<CoordAccess, { ok: true }>, id: string) {
  const ref = adminDb!.collection(ENTRIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Entry not found.', status: 404 } as const;
  const d = snap.data()!;
  if (!a.isDev) {
    if (d.coordinatorUid !== a.uid) return { error: 'Entry not found.', status: 404 } as const;
    if (d.month !== monthOf(Date.now()) && !d.unlocked) return { error: 'This month is closed. Ask the developer to unlock this entry.', status: 423 } as const;
  }
  return { ref, data: d } as const;
}
