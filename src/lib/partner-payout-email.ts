/**
 * Commission payout email sent to a referral partner when Smart Labs pays them
 * for a referred student who enrolled. Render-only. Brand navy/gold.
 */
export interface PartnerPayoutEmailData {
  partnerName: string;
  studentName: string;
  courseName?: string;
  courseFee: number;        // LKR the student paid
  commissionPercent: number;// e.g. 10, 12, 15
  payoutAmount: number;     // LKR paid to the partner
  note?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';
const esc = (s: string) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
const lkr = (n: number) => 'LKR ' + Math.round(Number(n) || 0).toLocaleString('en-LK');

export function renderPartnerPayoutEmail(o: PartnerPayoutEmailData): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const row = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:9px 0;color:#6b7280;font-size:13px;width:52%;">${k}</td><td style="padding:9px 0;font-weight:bold;font-size:${strong ? '16px' : '14px'};color:${strong ? '#16a34a' : '#111827'};">${v}</td></tr>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <div style="font-size:36px;line-height:1;margin-bottom:6px;">💰</div>
      <h1 style="color:#ffffff;margin:0;font-size:22px;">Your referral commission</h1>
      <p style="color:${GOLD};margin:8px 0 0;font-size:14px;font-weight:bold;">Thank you for your referral!</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">Hi <b>${esc(o.partnerName) || 'Partner'}</b>, great news — your referred student <b>${esc(o.studentName)}</b> has enrolled with Smart Labs, and your commission is being paid.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        ${o.courseName ? row('Course', esc(o.courseName)) : ''}
        ${row('Course fee', lkr(o.courseFee))}
        ${row('Your commission rate', `${o.commissionPercent}%`)}
        <tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:4px;"></td></tr>
        ${row('Commission paid to you', lkr(o.payoutAmount), true)}
      </table>
      ${o.note ? `<p style="margin:12px 0 0;color:#374151;font-size:13px;">${esc(o.note)}</p>` : ''}
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:14px 16px;margin-top:18px;">
        <p style="margin:0;color:#3730a3;font-size:13px;line-height:1.5;">Keep referring students to earn more — your commission rate increases as more of your referrals enrol each month.</p>
      </div>
    </div>
    <div style="background:${NAVY};padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Questions about your payout? Call <b style="color:${GOLD};">${SUPPORT}</b></p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">Smart Labs · ${date} · smartlabs.lk</p>
    </div>
  </div>`;
}
