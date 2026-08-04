/**
 * Student payment-receipt email for a PTE course enrollment.
 *
 * Kept in its own module (not inline in the webhook) so the template can be
 * unit-previewed and reused. Uses the Smart Labs brand navy/gold for the
 * header — email clients don't inherit the site's CSS theme, so a solid
 * branded header renders consistently everywhere.
 */
import { formatLkr, type PtePackage } from './pte-packages';

export interface PteReceiptData {
  pkg: PtePackage;
  orderId: string;
  paymentId: string;
  amount: number;
  fullName: string;
  batchName: string;
  phone: string;
}

export function renderPteReceiptEmail(o: PteReceiptData): string {
  const { pkg } = o;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const featureRows = pkg.features
    .map(f => `<li style="margin-bottom:8px;"><b style="color:#0D1B35;">${f.title}</b><br/><span style="color:#6b7280;font-size:13px;">${f.detail}</span></li>`)
    .join('');
  const accessRows = pkg.accessSteps
    .map((s, i) => `<tr><td style="padding:6px 10px 6px 0;color:#4f46e5;font-weight:bold;vertical-align:top;">${i + 1}.</td><td style="padding:6px 0;color:#374151;font-size:13px;">${s}</td></tr>`)
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:#0D1B35;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#F5D978;margin:0;font-size:22px;">Smart Labs — Payment Receipt</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Your PTE registration is confirmed 🎉</p>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 16px;">Hi <b>${o.fullName}</b>, thank you for enrolling with Smart Labs. Here is your receipt.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:42%;">Course Package</td><td style="padding:8px 0;font-weight:bold;font-size:14px;">${pkg.name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Batch</td><td style="padding:8px 0;font-weight:bold;font-size:14px;">${o.batchName || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount Paid</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;font-size:14px;">${formatLkr(o.amount)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Payment Date</td><td style="padding:8px 0;font-size:13px;">${date}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Order ID</td><td style="padding:8px 0;font-size:13px;font-family:monospace;">${o.orderId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">PayHere Payment ID</td><td style="padding:8px 0;font-size:13px;font-family:monospace;">${o.paymentId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Contact Number</td><td style="padding:8px 0;font-size:13px;">${o.phone}</td></tr>
      </table>

      <h3 style="margin:0 0 10px;color:#0D1B35;font-size:16px;">What your ${pkg.name} package unlocks</h3>
      <ul style="margin:0 0 20px;padding-left:18px;">${featureRows}</ul>

      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;margin-bottom:20px;">
        <h3 style="margin:0 0 10px;color:#3730a3;font-size:15px;">How to get your access</h3>
        <table style="width:100%;border-collapse:collapse;">${accessRows}</table>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:8px;">
        <p style="margin:0;color:#b91c1c;font-size:13px;"><b>Non-refundable payment:</b> This programme fee is strictly non-refundable under any circumstances.</p>
      </div>
    </div>

    <div style="background:#0D1B35;padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.75);margin:0;font-size:12px;">Need help? Call 077 453 3233 · smartlabs.lk · Rajagiriya &amp; Wattala</p>
    </div>
  </div>`;
}
