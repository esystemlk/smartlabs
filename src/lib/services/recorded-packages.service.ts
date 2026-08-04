import { db } from '@/lib/firebase';
import {
  collection, doc, query, where, orderBy, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import type { RecordedPackage, RecordedClass, RecordedEnrollment } from '@/types/recorded-package';

const PACKAGES = 'recorded_packages';
const CLASSES = 'recorded_classes';
const ENROLLMENTS = 'recorded_enrollments';

// ─── Packages ───────────────────────────────────────────────────────────────
export async function listPackages(onlyPublished = false): Promise<RecordedPackage[]> {
  const snap = await getDocs(collection(db, PACKAGES));
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordedPackage, 'id'>) }));
  if (onlyPublished) items = items.filter(p => p.published !== false);
  // Highest order first, then newest.
  items.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  return items;
}

export async function getPackage(id: string): Promise<RecordedPackage | null> {
  const snap = await getDoc(doc(db, PACKAGES, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<RecordedPackage, 'id'>) }) : null;
}

export async function addPackage(data: Omit<RecordedPackage, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, PACKAGES), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updatePackage(id: string, data: Partial<RecordedPackage>) {
  await updateDoc(doc(db, PACKAGES, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePackage(id: string) {
  // Remove the package and its classes.
  const classes = await listClasses(id);
  await Promise.all(classes.map(c => c.id && deleteDoc(doc(db, CLASSES, c.id))));
  await deleteDoc(doc(db, PACKAGES, id));
}

// ─── Classes (inside a package) ─────────────────────────────────────────────
export async function listClasses(packageId: string, onlyPublished = false): Promise<RecordedClass[]> {
  const snap = await getDocs(query(collection(db, CLASSES), where('packageId', '==', packageId)));
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordedClass, 'id'>) }));
  if (onlyPublished) items = items.filter(c => c.published !== false);
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function addClass(data: Omit<RecordedClass, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, CLASSES), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateClass(id: string, data: Partial<RecordedClass>) {
  await updateDoc(doc(db, CLASSES, id), data);
}

export async function deleteClass(id: string) {
  await deleteDoc(doc(db, CLASSES, id));
}

// ─── Enrollments (student reads; writes are server-side) ────────────────────
export async function getMyEnrollments(userId: string): Promise<RecordedEnrollment[]> {
  const snap = await getDocs(query(collection(db, ENROLLMENTS), where('userId', '==', userId)));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordedEnrollment, 'id'>) }));
}

export async function listAllEnrollments(): Promise<RecordedEnrollment[]> {
  const snap = await getDocs(collection(db, ENROLLMENTS));
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RecordedEnrollment, 'id'>) }));
  items.sort((a, b) => {
    const ta = (a.purchasedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const tb = (b.purchasedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return items;
}
