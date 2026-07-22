import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  BYPASS_COOKIE, SITE_MODE_DOC, SITE_MODES, hashBypassToken, type SiteMode,
} from '@/lib/site-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Site kill-switch API. DEVELOPER ROLE ONLY — stricter than the rest of the
 * admin API, which also allows admin/teacher. The secret URL is only
 * obscurity; this check is the actual gate.
 */
async function verifyDeveloper(request: Request) {
  if (!adminAuth || !adminDb) {
    return { ok: false as const, status: 500, error: 'Server not configured.' };
  }
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return { ok: false as const, status: 401, error: 'Unauthorized.' };
  }
  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(header.slice(7))).uid;
  } catch {
    return { ok: false as const, status: 401, error: 'Invalid or expired session.' };
  }
  const snap = await adminDb.collection('users').doc(uid).get();
  const role = snap.data()?.role as string | undefined;
  if (role !== 'developer') {
    return { ok: false as const, status: 403, error: 'Developer access required.' };
  }
  return { ok: true as const, uid, email: snap.data()?.email as string | undefined };
}

const ref = () => adminDb!.collection(SITE_MODE_DOC.collection).doc(SITE_MODE_DOC.doc);

/** Current mode — developer only. */
export async function GET(request: Request) {
  const auth = await verifyDeveloper(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const snap = await ref().get();
  const d = snap.data() ?? {};
  return NextResponse.json({
    mode: (d.mode as SiteMode) ?? 'live',
    message: d.message ?? '',
    updatedBy: d.updatedBy ?? null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
  });
}

/**
 * Set the mode. Body: { mode, message?, preview? }
 * `preview: true` also issues a bypass cookie so the developer can still
 * browse the real site while it is switched off for everyone else.
 */
export async function POST(request: Request) {
  const auth = await verifyDeveloper(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { mode, message, preview } = (await request.json()) as {
    mode?: SiteMode; message?: string; preview?: boolean;
  };
  if (!mode || !SITE_MODES.some(m => m.id === mode)) {
    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
  }

  // Rotate the bypass token whenever the mode changes so old cookies die.
  const bypassToken = crypto.randomUUID();

  await ref().set(
    {
      mode,
      message: (message ?? '').slice(0, 300),
      // Only the hash is stored: this doc is world-readable, so the plain
      // token would be a public skeleton key past the kill switch.
      bypassTokenHash: await hashBypassToken(bypassToken),
      // Scrub the plaintext token written by earlier versions.
      bypassToken: FieldValue.delete(),
      updatedBy: auth.email ?? auth.uid,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  const res = NextResponse.json({ success: true, mode, bypassIssued: !!preview });

  if (preview && mode !== 'live') {
    res.cookies.set(BYPASS_COOKIE, bypassToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
  } else {
    res.cookies.delete(BYPASS_COOKIE);
  }

  return res;
}
