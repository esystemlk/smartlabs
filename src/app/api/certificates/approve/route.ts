import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { CertificateDocument } from '@/lib/pdf/certificate-template';
import { LetterDocument } from '@/lib/pdf/letter-template';
import { getCertificateRequest, updateCertificateRequest, generateCertificateNumber } from '@/lib/services/certificate.service';
import nodemailer from 'nodemailer';
import React from 'react';

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

    const { requestId, overrideName, overrideDate } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const certRequest = await getCertificateRequest(requestId);
    if (!certRequest) {
      return NextResponse.json({ error: 'Certificate request not found' }, { status: 404 });
    }

    const studentName = overrideName || certRequest.nameOnCertificate;
    const certificateNumber = generateCertificateNumber(requestId);
    const issueDate = overrideDate || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Generate PDFs server-side
    const [certBuffer, letterBuffer] = await Promise.all([
      renderToBuffer(React.createElement(CertificateDocument, { studentName, certificateNumber, issueDate }) as React.ReactElement<DocumentProps>),
      renderToBuffer(React.createElement(LetterDocument, { studentName, certificateNumber, issueDate }) as React.ReactElement<DocumentProps>),
    ]);

    // Send email with attachments
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const certTypeName = certRequest.type === 'digital' ? 'Digital' : 'Printed';

    await transporter.sendMail({
      from: `"Smart Labs LK" <${process.env.GMAIL_USER}>`,
      to: certRequest.email,
      subject: `Your Smart Labs PTE Certificate is Ready — ${studentName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0D1B35;padding:32px;text-align:center;">
            <h1 style="color:#F5D978;margin:0;font-size:24px;letter-spacing:2px;">SMART<span style="color:#fff;">LABS</span> LK</h1>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:13px;letter-spacing:1px;">PTE ACADEMIC TRAINING CENTRE</p>
          </div>
          <div style="background:#f8f9fa;padding:32px;">
            <h2 style="color:#0D1B35;margin:0 0 8px;">Your Certificate is Ready!</h2>
            <p style="color:#374151;line-height:1.6;">Dear <strong>${studentName}</strong>,</p>
            <p style="color:#374151;line-height:1.6;">
              We are pleased to inform you that your <strong>${certTypeName} PTE Training Certificate</strong> and
              official completion letter have been verified and generated. Please find both documents attached to this email.
            </p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Certificate Details</p>
              <p style="margin:4px 0;font-size:14px;"><strong>Name:</strong> ${studentName}</p>
              <p style="margin:4px 0;font-size:14px;"><strong>Certificate No:</strong> ${certificateNumber}</p>
              <p style="margin:4px 0;font-size:14px;"><strong>Issue Date:</strong> ${issueDate}</p>
              <p style="margin:4px 0;font-size:14px;"><strong>Type:</strong> ${certTypeName} Certificate & Letter</p>
            </div>
            <div style="background:#fef9e7;border-left:4px solid #C9A84C;padding:14px;border-radius:0 6px 6px 0;margin-bottom:20px;">
              <p style="margin:0;font-size:13px;color:#7c6520;">
                <strong>Attachments:</strong> Please open the attached PDF files.<br/>
                1. <strong>SmartLabs_Certificate.pdf</strong> — Your official PTE training certificate<br/>
                2. <strong>SmartLabs_Letter.pdf</strong> — Official completion letter
              </p>
            </div>
            <p style="color:#374151;line-height:1.6;">
              Congratulations on completing your PTE Academic training with Smart Labs LK.
              We wish you all the very best in your upcoming PTE examination!
            </p>
            <p style="color:#374151;">Warm regards,<br/><strong>Lahiruka Weeraratne</strong><br/><span style="color:#6b7280;">Lecturer, Smart Labs LK</span></p>
          </div>
          <div style="background:#0D1B35;padding:16px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">www.smartlabs.lk · 077 453 3233 · info@smartlabs.lk</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `SmartLabs_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`,
          content: certBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `SmartLabs_Letter_${studentName.replace(/\s+/g, '_')}.pdf`,
          content: letterBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await updateCertificateRequest(requestId, {
      status: 'approved',
    });

    return NextResponse.json({ success: true, certificateNumber });
  } catch (error) {
    console.error('[certificates/approve] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
