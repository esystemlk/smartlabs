import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lists ONLY the students who hold credits (any pool) — paid balances, an active
 * monthly plan, or universal credits — with a per-pool breakdown. Admin/dev only.
 *
 * Firestore has no OR-across-fields query, so we run one range query per credit
 * field and merge the results by user id.
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

const PAID_FIELDS = [
  'essayPaidCredits', 'swtPaidCredits', 'sstPaidCredits', 'speakingPaidCredits',
  'ieltsEssayPaidCredits', 'universalPaidCredits', 'essayGenCredits',
] as const;
// Monthly plans stored as Firestore Timestamp/Date …
const MONTHLY_DATE_FIELDS = [
  'essayMonthlyExpiry', 'swtMonthlyExpiry', 'sstMonthlyExpiry', 'speakingMonthlyExpiry', 'universalMonthlyExpiry',
] as const;
// … and the one stored as an epoch-ms number (IELTS).
const MONTHLY_NUMBER_FIELDS = ['ieltsEssayMonthlyExpiry'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(v: any): number { return typeof v === 'number' ? v : 0; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expiryActive(v: any): boolean {
  if (v == null) return false;
  let ms = 0;
  if (typeof v === 'number') ms = v;
  else if (typeof v?.toDate === 'function') ms = v.toDate().getTime();
  else if (v instanceof Date) ms = v.getTime();
  return ms > Date.now();
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expiryIso(v: any): string | null {
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

    const usersCol = adminDb!.collection('users');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged = new Map<string, any>();

    const now = new Date();
    const queries = [
      ...PAID_FIELDS.map((f) => usersCol.where(f, '>', 0).get()),
      ...MONTHLY_DATE_FIELDS.map((f) => usersCol.where(f, '>', now).get()),
      ...MONTHLY_NUMBER_FIELDS.map((f) => usersCol.where(f, '>', Date.now()).get()),
    ];

    const results = await Promise.allSettled(queries);
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const doc of r.value.docs) {
        if (!merged.has(doc.id)) merged.set(doc.id, { uid: doc.id, ...doc.data() });
      }
    }

    const holders = [...merged.values()].map((d) => {
      const pools = {
        essay:     { paid: num(d.essayPaidCredits),     gen: num(d.essayGenCredits), monthlyActive: expiryActive(d.essayMonthlyExpiry),     monthlyExpiry: expiryIso(d.essayMonthlyExpiry) },
        swt:       { paid: num(d.swtPaidCredits),        monthlyActive: expiryActive(d.swtMonthlyExpiry),        monthlyExpiry: expiryIso(d.swtMonthlyExpiry) },
        sst:       { paid: num(d.sstPaidCredits),        monthlyActive: expiryActive(d.sstMonthlyExpiry),        monthlyExpiry: expiryIso(d.sstMonthlyExpiry) },
        speaking:  { paid: num(d.speakingPaidCredits),   monthlyActive: expiryActive(d.speakingMonthlyExpiry),   monthlyExpiry: expiryIso(d.speakingMonthlyExpiry) },
        ieltsEssay:{ paid: num(d.ieltsEssayPaidCredits), monthlyActive: expiryActive(d.ieltsEssayMonthlyExpiry), monthlyExpiry: expiryIso(d.ieltsEssayMonthlyExpiry) },
        universal: { paid: num(d.universalPaidCredits),  monthlyActive: expiryActive(d.universalMonthlyExpiry),  monthlyExpiry: expiryIso(d.universalMonthlyExpiry) },
      };
      const totalPaid = pools.essay.paid + pools.essay.gen + pools.swt.paid + pools.sst.paid
        + pools.speaking.paid + pools.ieltsEssay.paid + pools.universal.paid;
      const anyMonthly = pools.essay.monthlyActive || pools.swt.monthlyActive || pools.sst.monthlyActive
        || pools.speaking.monthlyActive || pools.ieltsEssay.monthlyActive || pools.universal.monthlyActive;
      return {
        uid: d.uid,
        email: (d.email as string) ?? '',
        displayName: (d.displayName as string) ?? (d.name as string) ?? '',
        role: (d.role as string) ?? 'student',
        pools,
        totalPaid,
        anyMonthly,
      };
    });

    // Highest balances first; users with only an active plan (0 paid) still listed.
    holders.sort((a, b) => (b.totalPaid - a.totalPaid) || (b.anyMonthly ? 1 : 0) - (a.anyMonthly ? 1 : 0));

    return NextResponse.json({ count: holders.length, holders });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[credit-holders] error:', error);
    return NextResponse.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
