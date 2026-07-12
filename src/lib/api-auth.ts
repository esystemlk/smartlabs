import { adminAuth, adminDb } from '@/lib/firebase-admin';

export type AuthResult =
  | { ok: true; uid: string; role: string }
  | { ok: false; status: number; error: string };

const STAFF_ROLES = new Set(['admin', 'developer', 'teacher']);

/**
 * Verify the request carries a valid Firebase ID token.
 * Returns the caller's uid + role, or an error result.
 */
export async function verifyAuthed(request: Request): Promise<AuthResult> {
  if (!adminAuth || !adminDb) {
    return { ok: false, status: 500, error: 'Server not initialized.' };
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized — sign in required.' };
  }
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired session.' };
  }
  const snap = await adminDb.collection('users').doc(uid).get();
  const role = (snap.data()?.role as string) ?? 'student';
  return { ok: true, uid, role };
}

/**
 * Verify the caller is signed in AND has a staff role (admin/developer/teacher).
 */
export async function verifyStaff(request: Request): Promise<AuthResult> {
  const result = await verifyAuthed(request);
  if (!result.ok) return result;
  if (!STAFF_ROLES.has(result.role)) {
    return { ok: false, status: 403, error: 'Forbidden — staff access required.' };
  }
  return result;
}
