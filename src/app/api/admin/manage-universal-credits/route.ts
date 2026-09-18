import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin management of the UNIVERSAL AI credit pool (usable on every AI part).
 *   GET  ?uid= | ?email=  → the user's universal balance + plan.
 *   POST { targetUid, action, amount?, days? }
 *     gift    — add N universal credits
 *     deduct  — remove N universal credits (clamped at 0, never negative)
 *     grant_plan — unlimited universal for N days
 *     clear_plan — remove the universal monthly plan
 *     reset   — zero universal credits AND remove the plan
 * Every change is written to the `admin_actions` audit collection.
 */
async function requireAdminOrDev(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not initialized.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let callerUid: string;
  try { callerUid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(callerUid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden — admin or developer access required.' }, { status: 403 });
  }
  return { uid: callerUid };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function universalActive(v: any): boolean {
  if (v == null) return false;
  let ms = 0;
  if (typeof v === 'number') ms = v;
  else if (typeof v?.toDate === 'function') ms = v.toDate().getTime();
  else if (v instanceof Date) ms = v.getTime();
  return ms > Date.now();
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isoOf(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v?.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

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
      universalPaidCredits: (d.universalPaidCredits as number) ?? 0,
      universalMonthlyExpiry: isoOf(d.universalMonthlyExpiry),
      universalMonthlyActive: universalActive(d.universalMonthlyExpiry),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminOrDev(request);
    if (auth instanceof NextResponse) return auth;
    const callerUid = auth.uid;

    const { targetUid, action, amount, days } = (await request.json()) as {
      targetUid: string;
      action: 'gift' | 'deduct' | 'grant_plan' | 'clear_plan' | 'reset';
      amount?: number;
      days?: number;
    };
    if (!targetUid || !action) return NextResponse.json({ error: 'targetUid and action are required.' }, { status: 400 });

    const userRef = adminDb!.collection('users').doc(targetUid);
    let description = '';

    // Run inside a transaction so deducts read the current balance and never go negative.
    const result = await adminDb!.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const d = snap.data() ?? {};
      const current = (d.universalPaidCredits as number) ?? 0;

      switch (action) {
        case 'gift': {
          const n = Math.floor(amount ?? 0);
          if (n < 1) throw new Error('amount must be ≥ 1.');
          tx.update(userRef, { universalPaidCredits: FieldValue.increment(n) });
          description = `Gifted ${n} universal AI credits`;
          break;
        }
        case 'deduct': {
          const n = Math.floor(amount ?? 0);
          if (n < 1) throw new Error('amount must be ≥ 1.');
          const next = Math.max(0, current - n);
          tx.update(userRef, { universalPaidCredits: next });
          description = `Deducted ${current - next} universal AI credits (requested ${n})`;
          break;
        }
        case 'grant_plan': {
          const numDays = Math.max(1, Math.floor(days ?? 40));
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + numDays);
          tx.update(userRef, { universalMonthlyExpiry: expiry });
          description = `Granted unlimited universal plan for ${numDays} days (expires ${expiry.toDateString()})`;
          break;
        }
        case 'clear_plan': {
          tx.update(userRef, { universalMonthlyExpiry: null });
          description = 'Removed the universal unlimited plan';
          break;
        }
        case 'reset': {
          tx.update(userRef, { universalPaidCredits: 0, universalMonthlyExpiry: null });
          description = 'Reset universal credits and plan to zero';
          break;
        }
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    });
    void result;

    await adminDb!.collection('admin_actions').add({
      type: 'universal_credits',
      performedBy: callerUid,
      targetUid,
      action,
      amount: amount ?? null,
      days: days ?? null,
      description,
      timestamp: new Date(),
    });

    const fresh = (await userRef.get()).data() ?? {};
    return NextResponse.json({
      success: true,
      description,
      universalPaidCredits: (fresh.universalPaidCredits as number) ?? 0,
      universalMonthlyExpiry: isoOf(fresh.universalMonthlyExpiry),
      universalMonthlyActive: universalActive(fresh.universalMonthlyExpiry),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    if (msg.startsWith('amount') || msg.startsWith('Unknown action')) return NextResponse.json({ error: msg }, { status: 400 });
    console.error('[manage-universal-credits] error:', error);
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
