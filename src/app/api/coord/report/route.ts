import { NextResponse } from 'next/server';
import { monthOf, reportCsv } from '@/lib/coordinators';
import { allEntriesMarked, coordAccess } from '@/lib/server/coordinators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET ?month=YYYY-MM (developer) → Excel-ready CSV of that month. */
export async function GET(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  if (!a.isDev) return NextResponse.json({ error: 'Developers only.' }, { status: 403 });
  const q = new URL(request.url).searchParams.get('month') || '';
  const month = /^\d{4}-\d{2}$/.test(q) ? q : monthOf(Date.now());
  const entries = (await allEntriesMarked()).filter(e => e.month === month);
  return new NextResponse(reportCsv(month, entries, e => (e.slipPath ? 'yes' : '')), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="smartlabs-coordinators-${month}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
