/**
 * Internal alert emailed to the Smart Labs team on every successful course
 * payment, so admins can act on new enrolments immediately. Render-only.
 */
export interface AdminPaymentAlertData {
  course: string;          // e.g. "PTE Boostify Night" / "IELTS Course" / "Recordings package"
  amount: number;          // LKR charged
  fullName: string;
  phone: string;
  email: string;
  orderId: string;
  paymentId?: string;
  batchName?: string;
  addOns?: string[];       // labels of selected add-ons
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const esc = (s: string) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
const lkr = (n: number) => 'LKR ' + Math.round(Number(n) || 0).toLocaleString('en-LK');

export function renderAdminPaymentAlert(o: AdminPaymentAlertData): string {
  const date = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const row = (k: string, v: string) =>
    `<tr><td style="padding:7px 0;color:#6b7280;font-size:13px;width:38%;">${k}</td><td style="padding:7px 0;font-weight:bold;font-size:14px;color:#111827;">${v}</td></tr>`;
  const addOns = (o.addOns ?? []).filter(Boolean);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:22px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:${GOLD};margin:0;font-size:19px;">✅ New paid enrolment</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">${esc(o.course)} · ${lkr(o.amount)}</p>
    </div>
    <div style="background:#fff;padding:22px 24px;border:1px solid #e5e7eb;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Student', esc(o.fullName) || '—')}
        ${row('Phone', esc(o.phone) || '—')}
        ${row('Email', esc(o.email) || '—')}
        ${row('Course', esc(o.course))}
        ${addOns.length ? row('Add-ons', addOns.map(esc).join(', ')) : ''}
        ${o.batchName ? row('Batch', esc(o.batchName)) : row('Batch', 'Awaiting assignment')}
        ${row('Amount paid', lkr(o.amount))}
        ${row('Order ID', `<span style="font-family:monospace">${esc(o.orderId)}</span>`)}
        ${o.paymentId ? row('PayHere ID', `<span style="font-family:monospace">${esc(o.paymentId)}</span>`) : ''}
        ${row('Paid at', date)}
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Assign a batch and notify the student from the admin dashboard.</p>
    </div>
  </div>`;
}
