import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { monthOf, summarize } from '@/lib/coordinators';
import { COURSES, ENTRIES, allEntriesMarked, coordAccess, getSettings, saveSettings, toEntry } from '@/lib/server/coordinators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * GET ?month=YYYY-MM → everything the tracker page needs.
 *  Coordinator: their own entries for the month + the shared course list.
 *  Developer: every coordinator's entries with duplicates marked, the month summary and settings.
 */
export async function GET(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const month = /^\d{4}-\d{2}$/.test(new URL(request.url).searchParams.get('month') || '') ? new URL(request.url).searchParams.get('month')! : monthOf(Date.now());

  const courseSnap = await adminDb!.collection(COURSES).orderBy('name').get();
  const courses = courseSnap.docs.map(d => ({ id: d.id, name: d.data().name, batches: d.data().batches || [] }));
  const me = { name: a.name, email: a.email, isDev: a.isDev, currentMonth: monthOf(Date.now()) };

  if (a.isDev) {
    const all = await allEntriesMarked();
    const entries = all.filter(e => e.month === month).sort((x, y) => y.createdAt - x.createdAt);
    // Duplicates from any month, so a match with an older entry is still visible.
    const dupPhones = new Set(entries.filter(e => e.duplicate).map(e => e.phone));
    const related = all.filter(e => dupPhones.has(e.phone) && e.month !== month);
    return NextResponse.json({ me, month, courses, entries, related, summary: summarize(entries), settings: await getSettings() }, { headers: NO_STORE });
  }

  const snap = await adminDb!.collection(ENTRIES).where('coordinatorUid', '==', a.uid).get();
  const entries = snap.docs.map(d => toEntry(d.id, d.data())).filter(e => e.month === month).sort((x, y) => y.createdAt - x.createdAt);
  // Coordinators never see duplicate flags or each other's work.
  return NextResponse.json({ me, month, courses, entries: entries.map(({ dupDecision, ...e }) => e) }, { headers: NO_STORE });
}

/** POST (developer): { coordinatorEmails, managementEmails } */
export async function POST(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  if (!a.isDev) return NextResponse.json({ error: 'Developers only.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const clean = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).map(x => String(x).trim().toLowerCase()).filter(x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))].slice(0, 20);
  const settings = { coordinatorEmails: clean(body.coordinatorEmails), managementEmails: clean(body.managementEmails) };
  await saveSettings(settings);
  return NextResponse.json({ ok: true, settings });
}
