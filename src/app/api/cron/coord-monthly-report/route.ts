import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';
import { monthOf, previousMonth, reportCsv, summarize } from '@/lib/coordinators';
import { allEntriesMarked, getSettings } from '@/lib/server/coordinators';

export const runtime = 'nodejs';
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** 1st of each month (vercel.json): last month's coordinator report, emailed to management with the CSV. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('Authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const month = previousMonth(monthOf(Date.now()));
  const { managementEmails } = await getSettings();
  // No management address saved yet: send it to the company mailbox instead of dropping it.
  const to = managementEmails.length ? managementEmails.join(',') : process.env.GMAIL_USER;
  if (!to) return NextResponse.json({ error: 'No recipient configured' }, { status: 500 });

  const entries = (await allEntriesMarked()).filter(e => e.month === month);
  const rows = summarize(entries);
  const flagged = rows.reduce((n, r) => n + r.flagged, 0);
  const lkr = (n: number) => 'LKR ' + n.toLocaleString('en-LK');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 4px">Coordinator report: ${month}</h2>
      <p style="margin:0 0 16px;color:#475569">Students enrolled by each coordinator last month. The attached file (opens in Excel) has every student.</p>
      <table cellpadding="8" style="border-collapse:collapse;font-size:14px">
        <tr style="background:#f1f5f9;text-align:left"><th>Coordinator</th><th>Students</th><th>Total paid</th><th>Balance due</th></tr>
        ${rows.length ? rows.map(r => `<tr style="border-top:1px solid #e2e8f0"><td>${esc(r.coordinator)}</td><td><b>${r.students}</b></td><td>${lkr(r.paid)}</td><td>${lkr(r.balance)}</td></tr>`).join('') : '<tr><td colspan="4">No students were entered this month.</td></tr>'}
      </table>
      ${flagged ? `<p style="color:#b45309">${flagged} student(s) were entered by more than one coordinator and are not counted until the developer decides who gets the credit.</p>` : ''}
    </div>`;
  await sendMail({
    to, subject: `Smart Labs coordinator report: ${month}`, html,
    attachments: [{ filename: `smartlabs-coordinators-${month}.csv`, content: reportCsv(month, entries, e => (e.slipPath ? 'yes' : '')), contentType: 'text/csv' }],
  });
  return NextResponse.json({ ok: true, month, coordinators: rows.length, students: rows.reduce((n, r) => n + r.students, 0) });
}
