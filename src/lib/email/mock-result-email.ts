import type { IeltsMockResult } from '@/lib/ielts-mock/types';

const NAVY = '#0D1B35';
const GOLD = '#F5D978';

// Branded HTML email summarising an IELTS mock result. The full examiner-style
// breakdown is attached as a PDF.
export function mockResultEmail(studentName: string, result: IeltsMockResult, dateLabel: string): { subject: string; html: string } {
  const subject = `Your IELTS Mock result: Band ${result.overall} — ${result.title}`;

  const skillRow = (name: string, band: number, sub: string) => `
    <td style="padding:0 6px;width:33.33%;vertical-align:top;">
      <div style="border:1px solid #E2E8F0;border-radius:10px;padding:14px 8px;text-align:center;">
        <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#64748B;font-weight:bold;">${name}</div>
        <div style="font-size:28px;font-weight:bold;color:${NAVY};margin:4px 0;">${band}</div>
        <div style="font-size:11px;color:#475569;">${sub}</div>
      </div>
    </td>`;

  const html = `
  <div style="margin:0;padding:0;background:#f1f5f9;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:${NAVY};padding:24px 28px;">
        <div style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:1px;">SMART LABS</div>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};margin-top:2px;">IELTS Academic · Mock Test Result</div>
      </div>

      <div style="padding:28px;">
        <p style="color:#0f172a;font-size:15px;margin:0 0 6px;">Hi ${studentName},</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Here is your result for <strong>${result.title}</strong> (${dateLabel}). Your full examiner-style report, including Writing feedback, is attached as a PDF.
        </p>

        <div style="background:${NAVY};border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">Overall Band</div>
          <div style="font-size:46px;font-weight:bold;color:#ffffff;line-height:1.1;">${result.overall}</div>
          <div style="font-size:13px;color:#cbd5e1;">${result.overallLabel}</div>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin-bottom:18px;">
          <tr>
            ${skillRow('Listening', result.listening.band, `${result.listening.raw}/${result.listening.total} correct`)}
            ${skillRow('Reading', result.reading.band, `${result.reading.raw}/${result.reading.total} correct`)}
            ${skillRow('Writing', result.writing.band, `T1 ${result.writing.task1Band} · T2 ${result.writing.task2Band}`)}
          </tr>
        </table>

        <p style="color:#64748B;font-size:12px;line-height:1.6;margin:0 0 16px;text-align:center;">
          Overall = (Listening ${result.listening.band} + Reading ${result.reading.band} + Writing ${result.writing.band}) ÷ 3.
          Speaking is assessed in person at Smart Labs.
        </p>

        <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
          Keep practising — you can take another mock any time from your dashboard. Need help understanding your report? Reply to this email or call us.
        </p>
      </div>

      <div style="background:${NAVY};padding:16px;text-align:center;">
        <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">smartlabs.lk · contact@smartlabs.lk · 070 691 4652</p>
        <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:6px 0 0;">Estimated band for practice. Not an official IELTS result.</p>
      </div>
    </div>
  </div>`;

  return { subject, html };
}
