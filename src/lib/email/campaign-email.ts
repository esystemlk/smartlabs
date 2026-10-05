/**
 * Re-engagement / marketing campaign email for registered users.
 *
 * A standalone template (preview + reuse) in the Smart Labs brand navy/gold.
 * Nothing in this module sends mail — it only renders HTML. Wiring it to an
 * actual send (broadcast to users) is done separately and gated on approval.
 */
export interface CampaignEmailData {
  fullName?: string;
  /** Absolute URL to the student dashboard (falls back to the live site). */
  dashboardUrl?: string;
  /** Absolute URL that turns off these campaign emails for this user. */
  unsubscribeUrl?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';
const PHONES = '077 453 3233 · 070 691 4652';

export function renderCampaignEmail(o: CampaignEmailData = {}): string {
  const name = (o.fullName || 'there').trim();
  const dash = o.dashboardUrl || 'https://www.smartlabs.lk/dashboard';
  const highlights: { title: string; detail: string }[] = [
    { title: 'IELTS Listening — Cambridge 11–15', detail: 'Full audio tests with drag-and-drop matching, map labelling and instant answer review.' },
    { title: 'IELTS Academic Reading', detail: 'Timed passages across Cambridge 11–21 with auto-marking.' },
    { title: 'PTE practice suite', detail: 'Speaking, Reading, Listening and Writing tasks with scoring.' },
    { title: 'Writing Task 2 feedback', detail: 'Draft an essay and get AI feedback on ideas, structure and grammar.' },
  ];
  const cards = highlights
    .map(h => `<tr><td style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
        <b style="color:${NAVY};font-size:14px;">${h.title}</b>
        <div style="color:#6b7280;font-size:13px;margin-top:4px;line-height:1.5;">${h.detail}</div>
      </td></tr><tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>`)
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:${GOLD};margin:0;font-size:22px;">Smart Labs</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your next band score is one practice away 🎯</p>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 14px;color:#111827;">Hi <b>${name}</b>,</p>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 18px;">
        We've been busy adding new practice to your account — and it's ready whenever you are.
        Keep your IELTS and PTE preparation on track with fresh, auto-marked tests you can take in minutes.
      </p>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${cards}</table>

      <div style="text-align:center;margin:24px 0 10px;">
        <a href="${dash}" style="display:inline-block;background:${NAVY};color:${GOLD};padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Resume your practice →</a>
      </div>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">Takes less than a minute to pick up where you left off.</p>
    </div>

    <div style="background:${NAVY};padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Questions? Call support on <b style="color:${GOLD};">${SUPPORT}</b> — or ${PHONES}</p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda${o.unsubscribeUrl ? ` · <a href="${o.unsubscribeUrl}" style="color:rgba(255,255,255,0.6);">unsubscribe</a>` : ''}</p>
    </div>
  </div>`;
}
