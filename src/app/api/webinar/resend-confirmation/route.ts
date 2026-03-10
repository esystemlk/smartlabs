import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const { students, webinarTitle, webinarDate, webinarTime } = await req.json();

        if (!students || !Array.isArray(students)) {
            return NextResponse.json({ success: false, error: 'Invalid students list' }, { status: 400 });
        }

        const title = webinarTitle || 'Free PTE Strategy Webinar';
        const dateStr = webinarDate || 'Sunday 15th';
        const timeStr = webinarTime || '9:00 AM';

        const results = [];

        for (const student of students) {
            const html = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SMARTLABS</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #111827;">Hello ${student.fullName},</h2>
            <p>Your registration for the <strong>${title}</strong> has been confirmed.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; font-size: 16px;">
                📅 <strong>Date:</strong> ${dateStr}<br>
                ⏰ <strong>Time:</strong> ${timeStr} (Sri Lanka Time)
              </p>
            </div>

            <p>You will receive another email shortly before the session with the webinar access links and resources.</p>
            
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
              Best regards,<br>
              <strong>SMARTLABS Team</strong>
            </p>
          </div>
        </div>
      `;

            try {
                await sendMail({
                    to: student.email,
                    subject: `Registration Confirmed: ${title}`,
                    html,
                });
                results.push({ id: student.id, success: true });
            } catch (error: any) {
                console.error(`Error sending confirmation to ${student.email}:`, error);
                results.push({ id: student.id, success: false, error: error.message });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Resend confirmation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
