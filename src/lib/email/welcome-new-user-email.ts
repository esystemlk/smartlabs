/**
 * Congratulations / welcome email for a brand-new user's first sign-in.
 *
 * A colourful, celebratory template in the Smart Labs brand. Render-only —
 * nothing here sends mail. Wiring it to the first-login event is done
 * separately and gated on approval.
 */
export interface WelcomeNewUserEmailData {
  fullName?: string;
  dashboardUrl?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';

export function renderWelcomeNewUserEmail(o: WelcomeNewUserEmailData = {}): string {
  const name = (o.fullName || 'there').trim();
  const dash = o.dashboardUrl || 'https://www.smartlabs.lk/dashboard';
  const steps: { emoji: string; title: string; detail: string; bg: string; ink: string }[] = [
    { emoji: '🎧', title: 'Try an IELTS Listening test', detail: 'Full Cambridge audio tests with instant marking.', bg: '#eef2ff', ink: '#3730a3' },
    { emoji: '📖', title: 'Practise Academic Reading', detail: 'Timed passages with auto-scored answers.', bg: '#ecfeff', ink: '#155e75' },
    { emoji: '✍️', title: 'Get Writing Task 2 feedback', detail: 'AI feedback on ideas, structure and grammar.', bg: '#fef3f2', ink: '#b42318' },
    { emoji: '🎯', title: 'Explore the PTE suite', detail: 'Speaking, Reading, Listening and Writing tasks.', bg: '#ecfdf5', ink: '#065f46' },
  ];
  const cards = steps.map(s => `
    <tr><td style="padding:14px 16px;background:${s.bg};border-radius:12px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
        <td style="width:34px;font-size:22px;vertical-align:top;line-height:1;">${s.emoji}</td>
        <td><b style="color:${s.ink};font-size:14px;">${s.title}</b>
        <div style="color:#475467;font-size:13px;margin-top:3px;line-height:1.5;">${s.detail}</div></td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>`).join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <!-- Colourful gradient hero -->
    <div style="background:${NAVY};background-image:linear-gradient(135deg,#4f46e5 0%,#0D1B35 45%,#0ea5a4 100%);padding:40px 24px 34px;border-radius:16px 16px 0 0;text-align:center;">
      <div style="font-size:44px;line-height:1;margin-bottom:8px;">🎉</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;">Welcome aboard, ${name}!</h1>
      <p style="color:${GOLD};margin:10px 0 0;font-size:15px;font-weight:bold;">Your Smart Labs account is ready 🚀</p>
    </div>

    <div style="background:#fff;padding:26px 24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 6px;">
        Congratulations on joining <b style="color:${NAVY};">Smart Labs</b> — you&rsquo;ve just taken the first step toward your target IELTS and PTE scores. 🙌
      </p>
      <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 20px;">Here are four great ways to get started today:</p>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 18px;">${cards}</table>

      <div style="text-align:center;margin:22px 0 8px;">
        <a href="${dash}" style="display:inline-block;background-image:linear-gradient(135deg,#4f46e5,#0ea5a4);color:#ffffff;padding:14px 34px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:15px;">Start learning →</a>
      </div>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">Pick one task and give it 10 minutes — momentum does the rest.</p>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-top:22px;text-align:center;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">Need a hand getting started? Our team is one call away on <b>${SUPPORT}</b>.</p>
      </div>
    </div>

    <div style="background:${NAVY};padding:18px 24px;border-radius:0 0 16px 16px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Support &amp; office: <b style="color:${GOLD};">${SUPPORT}</b> · 077 453 3233</p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda</p>
    </div>
  </div>`;
}
