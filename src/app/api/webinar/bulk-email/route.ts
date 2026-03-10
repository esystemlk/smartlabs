import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { students, lecturerName, zoomLink, resourcesLink, additionalMessage, webinarTitle, webinarDate, webinarTime } = await req.json();

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
            <p>This is a reminder for the <strong>${title}</strong> you registered for.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; font-size: 16px;">
                📅 <strong>Date:</strong> ${dateStr}<br>
                ⏰ <strong>Time:</strong> ${timeStr} (Sri Lanka Time)<br>
                👨‍🏫 <strong>Lecturer:</strong> ${lecturerName}
              </p>
            </div>

            <div style="margin: 24px 0; padding: 20px; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
              <h3 style="margin-top: 0; color: #1e40af;">🔗 Access Links</h3>
              <p style="margin-bottom: 12px;">
                <strong>Join the Webinar:</strong><br>
                <a href="${zoomLink}" style="color: #3b82f6; word-break: break-all;">${zoomLink}</a>
              </p>
              <p style="margin-bottom: 0;">
                <strong>Webinar Resources:</strong><br>
                <a href="${resourcesLink}" style="color: #3b82f6; word-break: break-all;">${resourcesLink}</a>
              </p>
            </div>

            ${additionalMessage ? `
              <div style="margin: 24px 0; padding: 15px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-style: italic;">${additionalMessage}</p>
              </div>
            ` : ''}

            <p style="font-weight: bold; color: #111827;">Please join the webinar 10 minutes before the start time.</p>
            <p>We look forward to seeing you.</p>
            
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
          subject: `Your Webinar Link – ${title}`,
          html,
        });
        results.push({ id: student.id, success: true });
      } catch (error: any) {
        console.error(`Error sending bulk email to ${student.email}:`, error);
        results.push({ id: student.id, success: false, error: error.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Bulk email error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
