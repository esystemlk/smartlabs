import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Non-guessable, readable code: SL- + 6 base32 chars (no 0/1/O/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => 'SL-' + Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

/**
 * Returns the caller's referral code, assigning one the first time an approved +
 * active partner opens their workspace. Owner-authed; writes via admin SDK only.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired.' }, { status: 401 }); }

    const partnerRef = adminDb.collection('partners').doc(uid);
    const snap = await partnerRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not a partner account.' }, { status: 404 });
    const p = snap.data() as { referralCode?: string; reviewStatus?: string; accountState?: string };

    // Only approved partners (not suspended/deactivated/banned/closed) get a live code.
    if (p.reviewStatus !== 'approved' || ['suspended', 'deactivated', 'banned', 'closed'].includes(p.accountState ?? '')) {
      return NextResponse.json({ error: 'Referral code is available once your partnership is active.' }, { status: 403 });
    }

    // Promote an approved partner to active once their email is verified
    // (approval may have happened before they verified).
    if (p.accountState === 'pending_activation') {
      try {
        const u = await adminAuth.getUser(uid);
        if (u.emailVerified) await partnerRef.set({ accountState: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      } catch { /* non-fatal */ }
    }

    if (p.referralCode) return NextResponse.json({ code: p.referralCode });

    // Claim a unique code transactionally.
    let assigned = '';
    for (let attempt = 0; attempt < 6 && !assigned; attempt++) {
      const code = genCode();
      const codeRef = adminDb.collection('partner_codes').doc(code);
      // eslint-disable-next-line no-await-in-loop
      const ok = await adminDb.runTransaction(async (tx) => {
        const c = await tx.get(codeRef);
        if (c.exists) return false;
        const fresh = await tx.get(partnerRef);
        const existing = fresh.data()?.referralCode as string | undefined;
        if (existing) { assigned = existing; return true; }
        tx.set(codeRef, { uid, active: (fresh.data()?.accountState ?? 'active') === 'active', createdAt: FieldValue.serverTimestamp() });
        tx.update(partnerRef, { referralCode: code, updatedAt: FieldValue.serverTimestamp() });
        assigned = code;
        return true;
      });
      if (ok && assigned) break;
    }
    if (!assigned) return NextResponse.json({ error: 'Could not assign a code, please retry.' }, { status: 500 });

    return NextResponse.json({ code: assigned });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/referral-code] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
