/**
 * "Welcome back" email sent when a user signs in to the website.
 *
 * A standalone template (preview + reuse) in the Smart Labs brand navy/gold.
 * Nothing in this module sends mail — it only renders HTML. Wiring it to the
 * sign-in flow (and throttling how often it goes out) is done separately and
 * gated on approval.
 */
export interface WelcomeBackEmailData {
  fullName?: string;
  dashboardUrl?: string;
  /** Human-readable sign-in time, e.g. "5 Oct 2026, 2:14 PM". */
  signedInAt?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';

export function renderWelcomeBackEmail(o: WelcomeBackEmailData = {}): string {
  const name = (o.fullName || 'there').trim();
  const dash = o.dashboardUrl || 'https://www.smartlabs.lk/dashboard';
  const links: { label: string; href: string }[] = [
    { label: 'IELTS Listening', href: 'https://www.smartlabs.lk/dashboard/ielts/listening' },
    { label: 'IELTS Reading', href: 'https://www.smartlabs.lk/dashboard/ielts/reading' },
    { label: 'Writing Task 2 feedback', href: 'https://www.smartlabs.lk/ai-ielts-essay-practice' },
  ];
  const linkRow = links
    .map(l => `<a href="${l.href}" style="display:inline-block;background:#eef2ff;color:#3730a3;padding:8px 14px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:13px;margin:0 6px 8px 0;">${l.label}</a>`)
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:${GOLD};margin:0;font-size:20px;">Smart Labs</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Welcome back 👋</p>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 12px;color:#111827;">Hi <b>${name}</b>, good to see you again!</p>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 16px;">
        You just signed in${o.signedInAt ? ` on <b>${o.signedInAt}</b>` : ''}. Jump straight back into your preparation:
      </p>

      <div style="margin:0 0 18px;">${linkRow}</div>

      <div style="text-align:center;margin:20px 0 6px;">
        <a href="${dash}" style="display:inline-block;background:${NAVY};color:${GOLD};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Go to my dashboard →</a>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;margin-top:20px;">
        <p style="margin:0;color:#9a3412;font-size:12px;line-height:1.5;">Didn't sign in just now? Please secure your account and call us on <b>${SUPPORT}</b> right away.</p>
      </div>
    </div>

    <div style="background:${NAVY};padding:16px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.6);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda · Support ${SUPPORT}</p>
    </div>
  </div>`;
}
