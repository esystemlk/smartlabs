import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * An active partner edits their own contact details. Username and email are not
 * editable here. Mirrors the change onto the application record for history.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired.' }, { status: 401 }); }

    const body = (await request.json()) as Record<string, string>;

    const partnerRef = adminDb.collection('partners').doc(uid);
    const snap = await partnerRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not a partner account.' }, { status: 404 });
    const p = snap.data() as { ref?: string; partnerType?: string; accountState?: string; reviewStatus?: string };
    if (p.reviewStatus !== 'approved' || ['suspended', 'deactivated', 'banned', 'closed'].includes(p.accountState ?? '')) {
      return NextResponse.json({ error: 'Your account must be active to edit your profile.' }, { status: 403 });
    }

    const isBiz = p.partnerType === 'business';
    const fullName = (body.fullName ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const location = (body.location ?? '').trim();
    const businessName = (body.businessName ?? '').trim();
    if (fullName.length < 2) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    if (phone.length < 6) return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'District or city is required.' }, { status: 400 });
    if (isBiz && businessName.length < 2) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });

    const now = FieldValue.serverTimestamp();
    const patch = {
      fullName, phone, location,
      businessName: isBiz ? businessName : null,
      address: (body.address ?? '').trim() || null,
      website: (body.website ?? '').trim() || null,
      updatedAt: now,
    };
    await partnerRef.set(patch, { merge: true });
    if (p.ref) {
      try { await adminDb.collection('partner_applications').doc(p.ref).set(patch, { merge: true }); } catch { /* history mirror is best-effort */ }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/profile/update] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
