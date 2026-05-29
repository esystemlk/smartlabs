import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireAdminOrDev(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) {
    return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
  }
  const callerSnap = await adminDb.collection('users').doc(callerUid).get();
  const callerRole: string = (callerSnap.data()?.role as string) ?? 'student';
  if (!['admin', 'developer'].includes(callerRole)) {
    return NextResponse.json({ error: 'Forbidden — admin or developer access required.' }, { status: 403 });
  }
  return { uid: callerUid };
}

// ─── GET: Look up a user by UID or email, return full credit status ───────────
export async function GET(request: Request) {
  try {
    const auth = await requireAdminOrDev(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const targetUid   = searchParams.get('uid');
    const targetEmail = searchParams.get('email');

    if (!targetUid && !targetEmail) {
      return NextResponse.json({ error: 'Provide uid or email query param.' }, { status: 400 });
    }

    let uid = targetUid ?? '';

    // Resolve email → uid via Firebase Auth
    if (!uid && targetEmail) {
      try {
        const fbUser = await adminAuth!.getUserByEmail(targetEmail.trim());
        uid = fbUser.uid;
      } catch {
        return NextResponse.json({ error: 'No account found with that email address.' }, { status: 404 });
      }
    }

    const userSnap = await adminDb!.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User document not found in Firestore.' }, { status: 404 });
    }

    const d = userSnap.data() ?? {};
    const monthlyExpiry = (d.essayMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

    return NextResponse.json({
      uid,
      email:              (d.email as string)             ?? '',
      displayName:        (d.displayName as string)       ?? (d.name as string) ?? '',
      role:               (d.role as string)              ?? 'student',
      essayFreeUsed:      (d.essayFreeUsed    as number)  ?? 0,
      essayPaidCredits:   (d.essayPaidCredits as number)  ?? 0,
      essayGenCredits:    (d.essayGenCredits  as number)  ?? 0,
      essayMonthlyExpiry: monthlyExpiry?.toISOString()    ?? null,
      monthlyActive:      !!(monthlyExpiry && monthlyExpiry > new Date()),
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}

// ─── POST: Modify a user's essay credits ──────────────────────────────────────
// Body: { targetUid, action, amount?, days? }
// Actions:
//   add_scoring   — add N paid scoring credits
//   add_gen       — add N generation credits
//   set_monthly   — grant unlimited scoring for N days (default 30)
//   reset_free    — reset free-used counter back to 0
//   reset_all     — reset all essay credit fields
export async function POST(request: Request) {
  try {
    const auth = await requireAdminOrDev(request);
    if (auth instanceof NextResponse) return auth;
    const callerUid = auth.uid;

    const body = await request.json();
    const { targetUid, action, amount, days } = body as {
      targetUid: string;
      action: 'add_scoring' | 'add_gen' | 'set_monthly' | 'reset_free' | 'reset_all';
      amount?: number;
      days?: number;
    };

    if (!targetUid || !action) {
      return NextResponse.json({ error: 'targetUid and action are required.' }, { status: 400 });
    }

    const userRef  = adminDb!.collection('users').doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let update: Record<string, any> = {};
    let description = '';

    switch (action) {
      case 'add_scoring': {
        const n = Math.max(1, Math.floor(amount ?? 0));
        if (!n) return NextResponse.json({ error: 'amount must be ≥ 1.' }, { status: 400 });
        update = { essayPaidCredits: FieldValue.increment(n) };
        description = `Added ${n} scoring credits`;
        break;
      }
      case 'add_gen': {
        const n = Math.max(1, Math.floor(amount ?? 0));
        if (!n) return NextResponse.json({ error: 'amount must be ≥ 1.' }, { status: 400 });
        update = { essayGenCredits: FieldValue.increment(n) };
        description = `Added ${n} generation credits`;
        break;
      }
      case 'set_monthly': {
        const numDays = days ?? 30;
        const expiry  = new Date();
        expiry.setDate(expiry.getDate() + numDays);
        update = { essayMonthlyExpiry: expiry };
        description = `Granted unlimited scoring plan for ${numDays} days (expires ${expiry.toDateString()})`;
        break;
      }
      case 'reset_free': {
        update = { essayFreeUsed: 0 };
        description = 'Reset free-used counter to 0';
        break;
      }
      case 'reset_all': {
        update = {
          essayFreeUsed:      0,
          essayPaidCredits:   0,
          essayGenCredits:    0,
          essayMonthlyExpiry: null,
        };
        description = 'Reset ALL essay credits to zero';
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    await userRef.update(update);

    // Log the admin action for audit trail
    await adminDb!.collection('admin_actions').add({
      type:        'essay_credits',
      performedBy: callerUid,
      targetUid,
      action,
      amount:      amount ?? null,
      days:        days   ?? null,
      description,
      timestamp:   new Date(),
    });

    // Return updated credit state
    const freshSnap = await userRef.get();
    const d = freshSnap.data() ?? {};
    const monthlyExpiry = (d.essayMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

    return NextResponse.json({
      success: true,
      description,
      credits: {
        essayFreeUsed:    (d.essayFreeUsed    as number) ?? 0,
        essayPaidCredits: (d.essayPaidCredits as number) ?? 0,
        essayGenCredits:  (d.essayGenCredits  as number) ?? 0,
        monthlyActive:    !!(monthlyExpiry && monthlyExpiry > new Date()),
        essayMonthlyExpiry: monthlyExpiry?.toISOString() ?? null,
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[manage-credits] Error:', error);
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
