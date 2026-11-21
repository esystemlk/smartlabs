import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { col, getSettings, lecturerFromDoc } from '@/lib/one-to-one-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public: active lecturers and the non-secret booking settings. */
export async function GET() {
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const [snap, s] = await Promise.all([col.lecturers().get(), getSettings()]);
  const lecturers = snap.docs.map(lecturerFromDoc).filter(l => l.active).sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({
    lecturers,
    settings: { stepMin: s.stepMin, cooldownMin: s.cooldownMin, holdMin: s.holdMin, minNoticeHours: s.minNoticeHours, daysAhead: s.daysAhead, address: s.address },
  });
}
