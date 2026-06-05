import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PteQuestion, PteSection } from '@/types/pte-question';

const COL = 'pte_questions';

export async function addQuestion(
  data: Omit<PteQuestion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestion(id: string, data: Partial<PteQuestion>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** List questions for a section/task (admin: all; trainer: pass onlyActive=true). */
export async function listQuestions(
  section: PteSection,
  taskType: string,
  onlyActive = false
): Promise<PteQuestion[]> {
  // Avoid composite-index requirements: filter by section+taskType, sort client-side.
  const q = query(
    collection(db, COL),
    where('section', '==', section),
    where('taskType', '==', taskType)
  );
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PteQuestion, 'id'>) }));
  if (onlyActive) items = items.filter(i => i.active !== false);
  // Newest first
  items.sort((a, b) => {
    const ta = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const tb = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return items;
}

/** Returns a random ACTIVE question for the trainer, or null if none exist. */
export async function getRandomActiveQuestion(
  section: PteSection,
  taskType: string
): Promise<PteQuestion | null> {
  const items = await listQuestions(section, taskType, true);
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}
