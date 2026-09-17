import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { getMockCredits } from '@/lib/mock-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!['admin', 'developer'].includes(auth.role)) {
    return NextResponse.json({ error: 'Only admins and developers can grant mock credits.' }, { status: 403 });
  }
  return auth;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function findUser(email: string) {
  try {
    return await adminAuth!.getUserByEmail(email);
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') return null;
    throw error;
  }
}

/** Resolve the registered email through Auth, rather than a case-sensitive profile query. */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    const email = normalizeEmail(new URL(request.url).searchParams.get('email'));
    if (!email) return NextResponse.json({ error: 'Enter a valid registered email address.' }, { status: 400 });
    const user = await findUser(email);
    if (!user) return NextResponse.json({ error: 'No registered user was found with that email.' }, { status: 404 });
    const snap = await adminDb!.collection('users').doc(user.uid).get();
    if (!snap.exists) return NextResponse.json({ error: 'This account has no profile yet. Ask the user to finish registering.' }, { status: 404 });
    const credits = await getMockCredits(user.uid);
    return NextResponse.json({
      uid: user.uid, email: user.email ?? email,
      displayName: snap.data()?.displayName || user.displayName || 'Student',
      paid: credits.paid, unlimited: credits.unlimited,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[manage-mock-credits] Lookup failed:', error);
    return NextResponse.json({ error: 'Could not look up the account. Please try again.' }, { status: 500 });
  }
}

/** Grant credits and record the receipt in one transaction. A retried request cannot grant twice. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const email = normalizeEmail(body?.email);
    const { targetUid, amount, requestId, note = '' } = body ?? {};
    if (!email || typeof targetUid !== 'string' || !targetUid ||
        !Number.isSafeInteger(amount) || amount < 1 || amount > 1000 ||
        typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId) ||
        typeof note !== 'string' || note.length > 300) {
      return NextResponse.json({ error: 'Choose a user and enter a whole number from 1 to 1,000. Notes may contain up to 300 characters.' }, { status: 400 });
    }
    const user = await findUser(email);
    if (!user) return NextResponse.json({ error: 'No registered user was found with that email.' }, { status: 404 });
    if (user.uid !== targetUid) return NextResponse.json({ error: 'The selected account has changed. Look up the email again.' }, { status: 409 });

    const userRef = adminDb!.collection('users').doc(user.uid);
    const receiptRef = adminDb!.collection('admin_actions').doc(`mock-credit-${auth.uid}-${requestId}`);
    const result = await adminDb!.runTransaction(async transaction => {
      const userSnap = await transaction.get(userRef);
      const receipt = await transaction.get(receiptRef);
      if (!userSnap.exists) return { status: 404, error: 'The user profile no longer exists.' };
      const current = userSnap.data()?.mockPaidCredits ?? 0;
      if (!Number.isSafeInteger(current) || current < 0) return { status: 409, error: 'The account balance needs review before adding credits.' };
      if (receipt.exists) {
        const previous = receipt.data()!;
        if (previous.targetUid !== user.uid || previous.amount !== amount || previous.note !== note.trim()) {
          return { status: 409, error: 'This request was already used for a different grant. Look up the user again.' };
        }
        return { status: 200, paid: current, duplicate: true };
      }
      const paid = current + amount;
      if (!Number.isSafeInteger(paid)) return { status: 409, error: 'The requested balance is too large.' };
      transaction.update(userRef, { mockPaidCredits: paid });
      transaction.set(receiptRef, {
        type: 'mock_credits', action: 'add_mock', performedBy: auth.uid,
        targetUid: user.uid, targetEmail: user.email ?? email, amount,
        previousBalance: current, newBalance: paid, note: note.trim(), requestId,
        description: `Added ${amount} mock test credit${amount === 1 ? '' : 's'}`,
        timestamp: FieldValue.serverTimestamp(),
      });
      return { status: 200, paid, duplicate: false };
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, paid: result.paid, duplicate: result.duplicate, amount });
  } catch (error) {
    console.error('[manage-mock-credits] Grant failed:', error);
    return NextResponse.json({ error: 'Could not confirm the grant. Retry the same request safely.' }, { status: 500 });
  }
}
