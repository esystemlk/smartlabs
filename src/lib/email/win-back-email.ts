/**
 * Win-back email for students who haven't signed in for 60+ days.
 *
 * Standalone template (preview + reuse). Render-only — sending is handled by
 * the daily win-back cron. Smart Labs brand navy/gold, warm and inviting.
 */
export interface WinBackEmailData {
  fullName?: string;
  dashboardUrl?: string;
  /** Rough number of days since last sign-in, for a personal touch. */
  daysAway?: number;
  unsubscribeUrl?: string;
}

const NAVY = '#0D1B35';
const GOLD = '#F5D978';
const SUPPORT = '070 691 4652';

export function renderWinBackEmail(o: WinBackEmailData = {}): string {
  const name = (o.fullName || 'there').trim();
  const dash = o.dashboardUrl || 'https://www.smartlabs.lk/dashboard';
  const awayLine = o.daysAway && o.daysAway > 0
    ? `It's been about ${o.daysAway} days since your last visit — your target score hasn't gone anywhere, and neither have we. 💙`
    : `It's been a while since your last visit — your target score hasn't gone anywhere, and neither have we. 💙`;
  const reasons: { emoji: string; text: string }[] = [
    { emoji: '🎧', text: 'New IELTS Listening tests (Cambridge 11–15) with instant marking' },
    { emoji: '📖', text: 'Academic Reading across Cambridge 11–21' },
    { emoji: '✍️', text: 'AI feedback on your Writing Task 2 essays' },
    { emoji: '⏱️', text: 'Just 15 minutes a day keeps your momentum going' },
  ];
  const list = reasons
    .map(r => `<tr><td style="padding:7px 0;font-size:14px;color:#374151;"><span style="display:inline-block;width:26px;font-size:17px;">${r.emoji}</span>${r.text}</td></tr>`)
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:${NAVY};padding:34px 24px 30px;border-radius:16px 16px 0 0;text-align:center;">
      <div style="font-size:40px;line-height:1;margin-bottom:6px;">👋</div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;">We've missed you, ${name}!</h1>
      <p style="color:${GOLD};margin:9px 0 0;font-size:14px;font-weight:bold;">Pick up right where you left off</p>
    </div>

    <div style="background:#fff;padding:26px 24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">${awayLine}</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 10px;">Here's what's waiting for you:</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${list}</table>

      <div style="text-align:center;margin:22px 0 8px;">
        <a href="${dash}" style="display:inline-block;background:${NAVY};color:${GOLD};padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:15px;">Come back and practise →</a>
      </div>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">One short session is all it takes to get back on track.</p>

      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:13px 16px;margin-top:22px;text-align:center;">
        <p style="margin:0;color:#3730a3;font-size:13px;line-height:1.5;">Stuck or need guidance? Talk to our team on <b>${SUPPORT}</b> — we're happy to help you plan your next steps.</p>
      </div>
    </div>

    <div style="background:${NAVY};padding:16px 24px;border-radius:0 0 16px 16px;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);margin:0 0 4px;font-size:12px;">Support &amp; office: <b style="color:${GOLD};">${SUPPORT}</b> · 077 453 3233</p>
      <p style="color:rgba(255,255,255,0.55);margin:0;font-size:11px;">smartlabs.lk · 19/3 Poorwarama Rd, Nugegoda${o.unsubscribeUrl ? ` · <a href="${o.unsubscribeUrl}" style="color:rgba(255,255,255,0.6);">unsubscribe</a>` : ''}</p>
    </div>
  </div>`;
}
