import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { studentName, studentEmail, studentPhone, level, registrationTime, adminEmails } = await req.json();

    // 1. Send confirmation to student
    const studentHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SMARTLABS</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #111827;">Hello ${studentName},</h2>
          <p>Thank you for registering for our <strong>Free PTE Strategy Webinar</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 16px;">
              📅 <strong>Date:</strong> Sunday 15th<br>
              ⏰ <strong>Time:</strong> 9:00 AM (Sri Lanka Time)
            </p>
          </div>

          <p>Your registration has been successfully confirmed.</p>
          <p>Before the webinar begins, you will receive another email containing:</p>
          <ul style="padding-left: 20px;">
            <li>The Zoom meeting link</li>
            <li>Learning resources for the session</li>
            <li>Final instructions for joining the webinar</li>
          </ul>
          
          <p style="margin-top: 24px;">Please check your inbox before the webinar day. If you do not receive the email, please check your spam or junk folder.</p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            Best regards,<br>
            <strong>SMARTLABS Team</strong>
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: studentEmail,
      subject: 'Webinar Registration Confirmed – Free PTE Strategy Webinar',
      html: studentHtml,
    });

    // 2. Send notification to admins
    // Fetch active admin emails from Firestore
    let adminRecipients: string[] = [];
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      if (adminDb) {
        const adminEmailsSnap = await adminDb.collection('webinarAdminEmails')
          .where('isActive', '==', true)
          .get();
        adminRecipients = adminEmailsSnap.docs.map(doc => doc.data().email);
      }
    } catch (dbError) {
      console.error('Error fetching admin emails from DB:', dbError);
    }

    // Fallback if no admins found in DB
    if (adminRecipients.length === 0) {
      adminRecipients = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin_email_1@gmail.com,admin_email_2@gmail.com').split(',');
    }

    const adminHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #111827; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Admin Alert</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #111827;">New PTE Webinar Registration</h2>
          <p>A new student has registered for the webinar.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0;">Student Details</h3>
            <p style="margin-bottom: 0;">
              <strong>Name:</strong> ${studentName}<br>
              <strong>Email:</strong> ${studentEmail}<br>
              <strong>Phone:</strong> ${studentPhone}<br>
              <strong>English Level:</strong> ${level}
            </p>
          </div>
          
          <p style="margin-top: 20px;"><strong>Registration Time:</strong> ${registrationTime}</p>
          <p>This student is now visible in the Webinar Admin Dashboard.</p>
        </div>
      </div>
    `;

    if (adminRecipients.length > 0) {
      await sendMail({
        to: adminRecipients.join(','),
        subject: 'New PTE Webinar Registration',
        html: adminHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
