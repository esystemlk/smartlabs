import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

/**
 * A partner whose application is `needs_info` or `rejected` can correct their
 * details and resubmit for review. Username and email are NOT editable here
 * (email changes require re-verification). Resets the status back to `pending`.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 }); }

    const body = (await request.json()) as Record<string, string>;

    const partnerRef = adminDb.collection('partners').doc(uid);
    const partnerSnap = await partnerRef.get();
    if (!partnerSnap.exists) return NextResponse.json({ error: 'Not a partner account.' }, { status: 404 });
    const partner = partnerSnap.data() as { ref: string; reviewStatus: string; partnerType: string };

    if (!['needs_info', 'rejected'].includes(partner.reviewStatus)) {
      return NextResponse.json({ error: 'This application cannot be edited right now.' }, { status: 400 });
    }

    const isBiz = partner.partnerType === 'business';
    const fullName = (body.fullName ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const location = (body.location ?? '').trim();
    const businessName = (body.businessName ?? '').trim();
    if (fullName.length < 2) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    if (phone.length < 6) return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'District or city is required.' }, { status: 400 });
    if (isBiz && businessName.length < 2) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });

    const now = FieldValue.serverTimestamp();
    const fields = {
      fullName, phone, location,
      address: (body.address ?? '').trim() || null,
      businessName: isBiz ? businessName : null,
      website: (body.website ?? '').trim() || null,
      businessRegNo: (body.businessRegNo ?? '').trim() || null,
      referralDescription: (body.referralDescription ?? '').trim() || null,
      estimatedVolume: (body.estimatedVolume ?? '').trim() || null,
    };

    const appRef = adminDb.collection('partner_applications').doc(partner.ref);
    await adminDb.runTransaction(async (tx) => {
      const a = await tx.get(appRef);
      if (!a.exists) throw new Error('APPLICATION_MISSING');
      const st = a.data()?.reviewStatus as string;
      if (!['needs_info', 'rejected'].includes(st)) throw new Error('NOT_EDITABLE');
      tx.update(appRef, { ...fields, reviewStatus: 'pending', reviewReason: null, resubmittedAt: now, updatedAt: now });
      tx.update(partnerRef, { fullName, phone, location, businessName: fields.businessName, reviewStatus: 'pending', updatedAt: now });
    });

    // Tell the team it's back in the queue (awaited — serverless).
    try {
      await sendMail({
        to: CONTACT, replyTo: CONTACT,
        subject: `Partner application resubmitted — ${partner.ref}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <p><b>${esc(fullName)}</b> updated and resubmitted application <b>${esc(partner.ref)}</b>. It's back in the review queue.</p>
        </div>`,
      });
    } catch (e) { console.error('[partners/resubmit] email failed:', e); }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'NOT_EDITABLE') return NextResponse.json({ error: 'This application can no longer be edited.' }, { status: 400 });
    console.error('[partners/resubmit] error:', error);
    return NextResponse.json({ error: `Could not resubmit: ${msg}` }, { status: 500 });
  }
}
