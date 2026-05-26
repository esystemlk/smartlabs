import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getCertificateRequest, updateCertificateRequest } from '@/lib/services/certificate.service';
import { sendMail } from '@/lib/mail';

async function verifyAdmin(token: string): Promise<boolean> {
  if (!adminAuth || !adminDb) return false;
  const decoded = await adminAuth.verifyIdToken(token);
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === 'admin' || role === 'developer' || role === 'teacher';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    const isAdmin = await verifyAdmin(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, reason } = await request.json();
    if (!requestId || !reason) {
      return NextResponse.json({ error: 'requestId and reason are required' }, { status: 400 });
    }

    const certRequest = await getCertificateRequest(requestId);
    if (!certRequest) {
      return NextResponse.json({ error: 'Certificate request not found' }, { status: 404 });
    }

    await updateCertificateRequest(requestId, {
      status: 'rejected',
      adminNotes: reason,
    });

    await sendMail({
      to: certRequest.email,
      subject: 'Update on Your Smart Labs Certificate Request',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0D1B35;padding:32px;text-align:center;">
            <h1 style="color:#F5D978;margin:0;font-size:24px;letter-spacing:2px;">SMART<span style="color:#fff;">LABS</span> LK</h1>
          </div>
          <div style="background:#f8f9fa;padding:32px;">
            <h2 style="color:#0D1B35;margin:0 0 16px;">Certificate Request Update</h2>
            <p style="color:#374151;line-height:1.6;">Dear <strong>${certRequest.nameOnCertificate}</strong>,</p>
            <p style="color:#374151;line-height:1.6;">
              We have reviewed your certificate request (Ref: <strong>${requestId}</strong>) and unfortunately
              we are unable to process it at this time.
            </p>
            <div style="background:#fff3f3;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 6px;color:#991b1b;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">Reason</p>
              <p style="margin:0;color:#374151;font-size:14px;">${reason}</p>
            </div>
            <p style="color:#374151;line-height:1.6;">
              If you believe this is an error or wish to resubmit with the correct information, please
              contact us directly or submit a new request from your dashboard.
            </p>
            <div style="margin:20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificate-request"
                 style="display:inline-block;background:#0D1B35;color:#F5D978;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                View My Requests →
              </a>
            </div>
            <p style="color:#374151;">For further assistance, please call us on <strong>077 453 3233</strong>.</p>
            <p style="color:#374151;">Regards,<br/><strong>Smart Labs LK Team</strong></p>
          </div>
          <div style="background:#0D1B35;padding:16px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">www.smartlabs.lk · 077 453 3233</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[certificates/reject] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
