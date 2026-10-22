import 'server-only';
import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import type { SpeakingRecording } from '@/lib/speaking-recordings';

export const validRecordingId = (id: string) => /^[a-zA-Z0-9_-]{20,80}$/.test(id);
export const recordingsFor = (uid: string) => adminDb!.collection('users').doc(uid).collection('speaking_recordings');
export const recordingAudio = (uid: string, id: string) => getStorage().bucket(firebaseConfig.storageBucket).file(`speaking-answers/${uid}/${id}`);
export function publicRecording(id: string, data: FirebaseFirestore.DocumentData): SpeakingRecording {
  return { id, taskType: data.taskType, title: data.title, questionId: data.questionId,
    questionLabel: data.questionLabel, source: data.source, createdAt: data.createdAt,
    mimeType: data.mimeType, status: data.status, ...(data.score ? { score: data.score } : {}) };
}
