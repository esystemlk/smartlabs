import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const ADMIN_ROLES = ['admin', 'developer', 'teacher'];
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'smart-labs-ekk8j.firebasestorage.app';
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

/** Upload a recorded-package cover image to Storage. Admin-only. */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const role = (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
    if (!ADMIN_ROLES.includes(role)) return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

    const { filename, mimeType, base64 } = (await request.json()) as { filename?: string; mimeType?: string; base64?: string };
    if (!base64 || !mimeType) return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    if (!/^image\//.test(mimeType)) return NextResponse.json({ error: 'Please upload an image file.' }, { status: 400 });

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_BYTES) return NextResponse.json({ error: 'Image too large (max 6 MB).' }, { status: 413 });

    const bucket = admin.storage().bucket(BUCKET);
    const safe = (filename || 'cover').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `recorded_package_covers/${Date.now()}_${safe}`;
    const token = randomUUID();
    await bucket.file(path).save(buffer, {
      resumable: false,
      metadata: { contentType: mimeType, metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[recorded-packages/upload-cover]', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
