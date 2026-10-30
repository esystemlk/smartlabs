import 'server-only';
import { createHash } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { itemBelongs, timestampMillis, grammarPackage, GRAMMAR_PACKAGE_ID, type SharedLearningItem } from '@/lib/recorded-learning';
import { includedGrammarAccess } from '@/lib/server/grammar-access';
import type { RecordedPackage } from '@/types/recorded-package';
export const validLearningId = (id: string) => /^[a-zA-Z0-9_-]{1,160}$/.test(id);
export async function learningPackage(id: string, uid?: string, role?: string) {
  const doc = await adminDb!.collection('recorded_packages').doc(id).get();
  if (!doc.exists && id!==GRAMMAR_PACKAGE_ID) return null;
  const pkg = id===GRAMMAR_PACKAGE_ID?grammarPackage(doc.data()):{ ...doc.data(), id: doc.id,includesGrammar:true } as RecordedPackage & { id: string };
  const staff = ['admin', 'developer', 'teacher'].includes(role || '');
  const enrollment = uid ? await adminDb!.collection('recorded_enrollments').doc(`${uid}_${id}`).get() : null;
  const access = enrollment?.data();
  const paidExpiry = timestampMillis(access?.expiresAt);
  const includedUntil=uid&&id===GRAMMAR_PACKAGE_ID?await includedGrammarAccess(uid):0;
  const expiresAt=Math.max(access?.status==='active'?paidExpiry:0,includedUntil);
  const owned = expiresAt > Date.now();
  // Hidden packages remain watchable by existing purchasers, but cannot be newly purchased.
  if (pkg.published === false && !owned && !staff) return null;
  return { pkg, allowed: staff || owned, expiresAt, owned, staff, included:includedUntil>Date.now()&&includedUntil>=(access?.status==='active'?paidExpiry:0) };
}
export async function learningItems(pkg: RecordedPackage & { id: string }) {
  const [classes, shared] = await Promise.all([
    adminDb!.collection('recorded_classes').where('packageId', '==', pkg.id).get(),
    adminDb!.collection('recorded_learning_items').get(),
  ]);
  const items: SharedLearningItem[] = pkg.productType==='grammar'?[]:classes.docs.filter(doc => doc.data().published !== false).map(doc => ({ ...doc.data(), title: String(doc.data().title || 'Recorded lesson'), id: `class:${doc.id}`, kind: 'video', group: 'course', exam: 'both', order: Number(doc.data().order) || 0, published: true } as SharedLearningItem));
  for (const doc of shared.docs) {
    const item = { ...doc.data(), id: `shared:${doc.id}` } as SharedLearningItem;
    if (itemBelongs(item, pkg)) items.push(item);
  }
  return items.sort((a,b) => a.order - b.order || a.title.localeCompare(b.title));
}
export function safeLearningItem(item: SharedLearningItem) {
  return { id: item.id, title: item.title, kind: item.kind, group: item.group, order: item.order, duration: item.duration || '', description: item.description || '' };
}
export function learningEmbedUrl(libraryId: string, videoId: string, accessExpiry: number) {
  if (!/^\d+$/.test(libraryId) || !/^[a-f\d-]{8,}$/i.test(videoId)) throw new Error('Invalid video reference');
  let keys: Record<string,string> = {};
  try { keys = JSON.parse(process.env.BUNNY_STREAM_EMBED_KEYS || '{}'); } catch { throw new Error('Invalid Bunny embed configuration'); }
  const key = keys[libraryId] || (process.env.BUNNY_STREAM_LIBRARY_ID === libraryId ? process.env.BUNNY_STREAM_EMBED_TOKEN_KEY : '');
  const url = new URL(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`);
  url.searchParams.set('autoplay', 'false'); url.searchParams.set('preload', 'false');
  if (key) {
    const expires = Math.floor(Math.min(Date.now() + 2 * 60 * 60 * 1000, accessExpiry || Infinity) / 1000);
    url.searchParams.set('expires', String(expires));
    url.searchParams.set('token', createHash('sha256').update(`${key}${videoId}${expires}`).digest('hex'));
  }
  return url.toString();
}
