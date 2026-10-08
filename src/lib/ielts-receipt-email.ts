/**
 * Student payment receipt for the IELTS course. Batch dates aren't fixed at
 * payment time, so the receipt tells the student their batch details will
 * follow by email + WhatsApp. Render-only. Brand navy/gold.
 */
export interface IeltsReceiptData {
  fullName: string;
  amount: number;
  orderId: string;
  paymentId: string;
  phone: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';
const esc = (s: string) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
const lkr = (n: number) => 'LKR ' + Math.round(Number(n) || 0).toLocaleString('en-LK');

export function renderIeltsReceiptEmail(o: IeltsReceiptData): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:42%;">${k}</td><td style="padding:8px 0;font-weight:bold;font-size:14px;color:#111827;">${v}</td></tr>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:26px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:${GOLD};margin:0;font-size:21px;">Smart Labs — IELTS</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Payment received 🎉</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 16px;color:#111827;">Hi <b>${esc(o.fullName) || 'there'}</b>, thank you for registering for the Smart Labs IELTS course. Here is your receipt.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        ${row('Course', 'IELTS Course · 1 month')}
        ${row('Amount paid', `<span style="color:#16a34a">${lkr(o.amount)}</span>`)}
        ${row('Payment date', date)}
        ${row('Order ID', `<span style="font-family:monospace">${esc(o.orderId)}</span>`)}
        ${row('PayHere ID', `<span style="font-family:monospace">${esc(o.paymentId)}</span>`)}
        ${row('Contact number', esc(o.phone) || '—')}
      </table>
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;">
        <h3 style="margin:0 0 6px;color:#3730a3;font-size:15px;">What happens next</h3>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">Our team will contact you with your <b>batch details, start date and WhatsApp group</b> by email and WhatsApp. You can also see this payment any time on your dashboard.</p>
      </div>
    </div>
    <div style="background:${NAVY};padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Questions? Call <b style="color:${GOLD};">${SUPPORT}</b></p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda</p>
    </div>
  </div>`;
}
