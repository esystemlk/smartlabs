import { db } from '../firebase';
import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  limit as fsLimit,
} from 'firebase/firestore';
import type { AIResponse, EssaySession } from '@/types/essay';

/**
 * Firestore subcollection: users/{uid}/essay_sessions/{id}
 * Persists a scored essay so it can be re-opened with the AI Tutor.
 */
function sessionsCol(uid: string) {
  return collection(db, 'users', uid, 'essay_sessions');
}

// Firestore rejects `undefined` values. AIResponse has many optional fields,
// so deep-clone through JSON to strip undefined (keeps null, preserves arrays).
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface SaveEssaySessionInput {
  topic: string;
  topicId: number | null;
  essayText: string;
  wordCount: number;
  targetScore: number | null;
  result: AIResponse;
}

export async function saveEssaySession(
  uid: string,
  data: SaveEssaySessionInput
): Promise<string> {
  const payload = stripUndefined({
    topic: data.topic,
    topicId: data.topicId ?? null,
    essayText: data.essayText,
    wordCount: data.wordCount,
    targetScore: data.targetScore ?? null,
    result: data.result,
  });
  const ref = await addDoc(sessionsCol(uid), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getEssaySession(
  uid: string,
  id: string
): Promise<EssaySession | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'essay_sessions', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<EssaySession, 'id'>) };
}

export async function listUserEssaySessions(
  uid: string,
  max = 20
): Promise<EssaySession[]> {
  const q = query(sessionsCol(uid), orderBy('createdAt', 'desc'), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<EssaySession, 'id'>) }));
}
