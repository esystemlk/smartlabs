import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// ─── POST: Add/set credits for a user ────────────────────────────────────────
// Body: { targetUid, action, amount?, monthlyDays? }
// action: 'add_paid' | 'set_free_used' | 'set_monthly' | 'reset'
// Only admins / developers can call this endpoint.

export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
    }

    // 1. Verify caller is an admin or developer
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
      return NextResponse.json({ error: 'Forbidden — admin access required.' }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { targetUid, action, amount, monthlyDays } = body as {
      targetUid: string;
      action: 'add_paid' | 'set_free_used' | 'set_monthly' | 'reset';
      amount?: number;
      monthlyDays?: number;
    };

    if (!targetUid || !action) {
      return NextResponse.json({ error: 'targetUid and action are required.' }, { status: 400 });
    }

    const userRef  = adminDb.collection('users').doc(targetUid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};

    let update: Record<string, unknown> = {};

    if (action === 'add_paid') {
      const currentPaid = (userData.essayPaidCredits as number) ?? 0;
      update = { essayPaidCredits: currentPaid + (amount ?? 0) };

    } else if (action === 'set_free_used') {
      update = { essayFreeUsed: amount ?? 0 };

    } else if (action === 'set_monthly') {
      const days  = monthlyDays ?? 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      update = { essayMonthlyExpiry: expiry };

    } else if (action === 'reset') {
      update = {
        essayFreeUsed:      0,
        essayPaidCredits:   0,
        essayMonthlyExpiry: null,
      };
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // If doc doesn't exist yet, create it; otherwise update
    if (!userSnap.exists) {
      await userRef.set({ ...update, createdAt: new Date() });
    } else {
      await userRef.update(update);
    }

    // Log admin action
    await adminDb.collection('admin_actions').add({
      performedBy: callerUid,
      targetUid,
      action,
      amount: amount ?? null,
      monthlyDays: monthlyDays ?? null,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Action "${action}" applied to user ${targetUid}.`,
      update,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[manage-credits] Error:', error);
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}

// ─── GET: Get a user's current credit info ────────────────────────────────────
export async function GET(request: Request) {
  try {
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
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUid = searchParams.get('uid');
    if (!targetUid) {
      return NextResponse.json({ error: 'uid query param required.' }, { status: 400 });
    }

    const userSnap = await adminDb.collection('users').doc(targetUid).get();
    const userData = userSnap.data() ?? {};
    const monthlyExpiry = (userData.essayMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

    return NextResponse.json({
      uid: targetUid,
      role:             (userData.role as string)             ?? 'student',
      essayFreeUsed:    (userData.essayFreeUsed    as number) ?? 0,
      essayPaidCredits: (userData.essayPaidCredits as number) ?? 0,
      essayMonthlyExpiry: monthlyExpiry?.toISOString() ?? null,
      monthlyActive: !!(monthlyExpiry && monthlyExpiry > new Date()),
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
