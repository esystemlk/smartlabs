import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
export type { CertType, CertStatus, IdentityType, PaymentStatus, CertificateRequest } from '@/types/certificate';
export { CERT_PRICES } from '@/types/certificate';
import type { CertificateRequest, CertType } from '@/types/certificate';

export const SRI_LANKA_COUNTRY_CODE = 'LK';

export async function createCertificateRequest(
  data: Omit<CertificateRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!adminDb) throw new Error('DB not initialized');
  const ref = adminDb.collection('certificate_requests').doc();
  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getCertificateRequest(id: string): Promise<CertificateRequest | null> {
  if (!adminDb) throw new Error('DB not initialized');
  const snap = await adminDb.collection('certificate_requests').doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<CertificateRequest, 'id'>) };
}

export async function updateCertificateRequest(
  id: string,
  data: Partial<CertificateRequest>
): Promise<void> {
  if (!adminDb) throw new Error('DB not initialized');
  await adminDb.collection('certificate_requests').doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getAllCertificateRequests(): Promise<CertificateRequest[]> {
  if (!adminDb) throw new Error('DB not initialized');
  const snap = await adminDb
    .collection('certificate_requests')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CertificateRequest, 'id'>) }));
}

export async function getUserCertificateRequests(userId: string): Promise<CertificateRequest[]> {
  if (!adminDb) throw new Error('DB not initialized');
  const snap = await adminDb
    .collection('certificate_requests')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CertificateRequest, 'id'>) }));
}

export function generateCertificateNumber(requestId: string): string {
  const year = new Date().getFullYear();
  const short = requestId.slice(-6).toUpperCase();
  return `SL-PTE-${year}-${short}`;
}

// Keep CertType in scope for CERT_PRICES usage in other server files
export type { CertType as _CertType };
