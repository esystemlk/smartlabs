/**
 * Sent to an IELTS student when an admin assigns them to a batch. Render-only.
 * Brand navy/gold, with the batch details and WhatsApp join link.
 */
export interface IeltsBatchEmailData {
  fullName: string;
  batchName: string;
  startDate?: string;
  schedule?: string;
  whatsappLink?: string;
  dashboardUrl?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';
const esc = (s: string) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

export function renderIeltsBatchEmail(o: IeltsBatchEmailData): string {
  const dash = o.dashboardUrl || 'https://www.smartlabs.lk/dashboard';
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:38%;">${k}</td><td style="padding:8px 0;font-weight:bold;font-size:14px;color:#111827;">${v}</td></tr>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <div style="font-size:38px;line-height:1;margin-bottom:6px;">🎓</div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;">You're enrolled!</h1>
      <p style="color:${GOLD};margin:8px 0 0;font-size:14px;font-weight:bold;">${esc(o.batchName)}</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 16px;color:#111827;">Hi <b>${esc(o.fullName) || 'there'}</b>, great news — you've been enrolled in your IELTS batch. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${row('Batch', esc(o.batchName))}
        ${o.startDate ? row('Start date', esc(o.startDate)) : ''}
        ${o.schedule ? row('Schedule', esc(o.schedule)) : ''}
      </table>
      ${o.whatsappLink ? `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 10px;color:#065f46;font-size:13px;">Join your batch WhatsApp group for class links, materials and updates:</p>
        <a href="${esc(o.whatsappLink)}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Join WhatsApp group →</a>
      </div>` : ''}
      <div style="text-align:center;margin:8px 0;">
        <a href="${dash}" style="display:inline-block;background:${NAVY};color:${GOLD};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Go to my dashboard →</a>
      </div>
    </div>
    <div style="background:${NAVY};padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Questions? Call <b style="color:${GOLD};">${SUPPORT}</b></p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda</p>
    </div>
  </div>`;
}
