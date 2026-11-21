import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { col, getSettings, busyFrom } from '@/lib/one-to-one-server';
import { addDays, colomboDate, colomboMin, freeStarts, HOUR_OPTIONS } from '@/lib/one-to-one';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public: bookable start times for a lecturer and session length over the booking horizon. */
export async function GET(request: NextRequest) {
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const lecturerId = request.nextUrl.searchParams.get('lecturer') ?? '';
  const hours = Number(request.nextUrl.searchParams.get('hours'));
  if (!lecturerId || !(HOUR_OPTIONS as readonly number[]).includes(hours)) {
    return NextResponse.json({ error: 'lecturer and hours (1–3) are required' }, { status: 400 });
  }
  const s = await getSettings();
  const now = Date.now();
  const earliest = now + s.minNoticeHours * 3_600_000;
  const today = colomboDate(now), last = addDays(today, s.daysAhead);

  // shortcut: loads all of a lecturer's windows/bookings and filters in memory; add a date index if these grow past a few thousand.
  const [avail, booked] = await Promise.all([
    col.availability().where('lecturerId', '==', lecturerId).get(),
    col.bookings().where('lecturerId', '==', lecturerId).get(),
  ]);
  const byDate = new Map<string, { startMin: number; endMin: number }[]>();
  for (const d of avail.docs) {
    const a = d.data();
    if (a.date < today || a.date > last) continue;
    byDate.set(a.date, [...(byDate.get(a.date) ?? []), { startMin: a.startMin, endMin: a.endMin }]);
  }
  const days = [...byDate.keys()].sort().map(date => {
    const earliestMin = date === colomboDate(earliest) ? colomboMin(earliest) : date < colomboDate(earliest) ? 24 * 60 : undefined;
    return { date, starts: freeStarts(byDate.get(date)!, busyFrom(booked.docs, date, now), hours, { stepMin: s.stepMin, cooldownMin: s.cooldownMin, earliestMin }) };
  }).filter(d => d.starts.length);
  return NextResponse.json({ days });
}
