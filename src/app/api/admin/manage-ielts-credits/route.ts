import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Auth: admin or developer only ────────────────────────────────────────────
async function requireAdminOrDev(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let callerUid: string;
  try {
    callerUid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
  }
  const callerSnap = await adminDb.collection('users').doc(callerUid).get();
  const role = (callerSnap.data()?.role as string) ?? 'student';
  if (!['admin', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden — admin or developer access required.' }, { status: 403 });
  }
  return { uid: callerUid };
}

function creditState(d: FirebaseFirestore.DocumentData) {
  const monthlyExpiry = (d.ieltsEssayMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
  return {
    ieltsEssayFreeUsed: (d.ieltsEssayFreeUsed as number) ?? 0,
    ieltsEssayPaidCredits: (d.ieltsEssayPaidCredits as number) ?? 0,
    ieltsEssayMonthlyExpiry: monthlyExpiry?.toISOString() ?? null,
    monthlyActive: !!(monthlyExpiry && monthlyExpiry > new Date()),
  };
}

// ─── GET: look up a user by uid or email ──────────────────────────────────────
export async function GET(request: Request) {
  try {
    const auth = await requireAdminOrDev(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const targetUid = searchParams.get('uid');
    const targetEmail = searchParams.get('email');
    if (!targetUid && !targetEmail) return NextResponse.json({ error: 'Provide uid or email.' }, { status: 400 });

    let uid = targetUid ?? '';
    if (!uid && targetEmail) {
      try { uid = (await adminAuth!.getUserByEmail(targetEmail.trim())).uid; }
      catch { return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 }); }
    }

    const snap = await adminDb!.collection('users').doc(uid).get();
    if (!snap.exists) return NextResponse.json({ error: 'User document not found.' }, { status: 404 });
    const d = snap.data() ?? {};

    return NextResponse.json({
      uid,
      email: (d.email as string) ?? '',
      displayName: (d.displayName as string) ?? (d.name as string) ?? '',
      role: (d.role as string) ?? 'student',
      ...creditState(d),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}

// ─── POST: modify a user's IELTS essay credits ────────────────────────────────
// Body: { targetUid, action, amount?, days? }
//   add_scoring — add N paid scoring credits
//   set_monthly — grant unlimited scoring for N days (default 40)
//   reset_free  — reset the free-used counter to 0
//   reset_all   — reset all IELTS essay credit fields
export async function POST(request: Request) {
  try {
    const auth = await requireAdminOrDev(request);
    if (auth instanceof NextResponse) return auth;
    const callerUid = auth.uid;

    const { targetUid, action, amount, days } = (await request.json()) as {
      targetUid: string;
      action: 'add_scoring' | 'set_monthly' | 'reset_free' | 'reset_all';
      amount?: number;
      days?: number;
    };
    if (!targetUid || !action) return NextResponse.json({ error: 'targetUid and action are required.' }, { status: 400 });

    const userRef = adminDb!.collection('users').doc(targetUid);
    if (!(await userRef.get()).exists) return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let update: Record<string, any> = {};
    let description = '';

    switch (action) {
      case 'add_scoring': {
        const n = Math.max(1, Math.floor(amount ?? 0));
        if (!n) return NextResponse.json({ error: 'amount must be ≥ 1.' }, { status: 400 });
        update = { ieltsEssayPaidCredits: FieldValue.increment(n) };
        description = `Added ${n} IELTS essay scoring credits`;
        break;
      }
      case 'set_monthly': {
        const numDays = days ?? 40;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + numDays);
        update = { ieltsEssayMonthlyExpiry: expiry };
        description = `Granted unlimited IELTS scoring for ${numDays} days (expires ${expiry.toDateString()})`;
        break;
      }
      case 'reset_free': {
        update = { ieltsEssayFreeUsed: 0 };
        description = 'Reset IELTS free-used counter to 0';
        break;
      }
      case 'reset_all': {
        update = { ieltsEssayFreeUsed: 0, ieltsEssayPaidCredits: 0, ieltsEssayMonthlyExpiry: null };
        description = 'Reset ALL IELTS essay credits to zero';
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    await userRef.update(update);
    await adminDb!.collection('admin_actions').add({
      type: 'ielts_essay_credits',
      performedBy: callerUid,
      targetUid,
      action,
      amount: amount ?? null,
      days: days ?? null,
      description,
      timestamp: new Date(),
    });

    const d = (await userRef.get()).data() ?? {};
    return NextResponse.json({ success: true, description, credits: creditState(d) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[manage-ielts-credits] Error:', error);
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
