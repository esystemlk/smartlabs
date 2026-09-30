import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

async function requireStaff(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer', 'teacher'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return { uid };
}

type Audience = 'active' | 'all' | 'one';

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { audience, uid, subject, body } = (await request.json()) as
      { audience?: Audience; uid?: string; subject?: string; body?: string };
    const subj = (subject ?? '').trim();
    const msg = (body ?? '').trim();
    if (!subj || !msg) return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    if (!audience || !['active', 'all', 'one'].includes(audience)) return NextResponse.json({ error: 'Choose an audience.' }, { status: 400 });
    if (audience === 'one' && !uid) return NextResponse.json({ error: 'Pick a partner to message.' }, { status: 400 });

    // Resolve recipients.
    const recipients: { email: string; name: string }[] = [];
    if (audience === 'one') {
      const p = (await adminDb!.collection('partners').doc(uid!).get()).data() as { email?: string; fullName?: string } | undefined;
      if (!p?.email) return NextResponse.json({ error: 'That partner has no email.' }, { status: 404 });
      recipients.push({ email: p.email, name: p.fullName ?? 'there' });
    } else {
      let qy = adminDb!.collection('partners') as FirebaseFirestore.Query;
      if (audience === 'active') qy = qy.where('accountState', '==', 'active');
      const snap = await qy.get();
      snap.forEach((d) => { const p = d.data(); if (p.email) recipients.push({ email: p.email, name: p.fullName ?? 'there' }); });
    }
    if (recipients.length === 0) return NextResponse.json({ error: 'No matching partners to email.' }, { status: 400 });

    // HTML-escape the plain-text body but keep line breaks; wrap in the house template.
    const htmlBody = esc(msg).replace(/\n/g, '<br/>');
    const wrap = (name: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
      <h2 style="color:#163C69">Hi ${esc(name)}</h2>
      <p style="line-height:1.6">${htmlBody}</p>
      <p style="color:#64748b;font-size:12px;margin-top:24px">You’re receiving this as a SmartLabs referral partner. Reply to reach ${CONTACT}.</p>
    </div>`;

    // One email each (never expose the list). Awaited — serverless kills fire-and-forget.
    const results = await Promise.allSettled(
      recipients.map((r) => sendMail({ to: r.email, replyTo: CONTACT, subject: subj, html: wrap(r.name) }))
    );
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    await adminDb!.collection('partner_broadcasts').add({
      subject: subj, body: msg, audience, targetUid: audience === 'one' ? uid : null,
      sentBy: staff.uid, sentAt: new Date(), recipientCount: sent, failedCount: failed,
    });

    return NextResponse.json({ success: true, sent, failed, total: recipients.length });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/broadcast] error:', error);
    return NextResponse.json({ error: `Could not send: ${m}` }, { status: 500 });
  }
}
