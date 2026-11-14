import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { KEY_SLOTS, keyForSlot, primeKeyMode } from '@/lib/ai-key-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF = new Set(['admin', 'developer']);

async function staff(request: Request): Promise<{ uid: string; email?: string } | NextResponse> {
  if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const h = request.headers.get('Authorization');
  if (!h?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let t: { uid: string; email?: string };
  try { t = await adminAuth.verifyIdToken(h.slice(7)); } catch { return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(t.uid).get()).data()?.role as string | undefined;
  if (!STAFF.has(role ?? '')) return NextResponse.json({ error: 'Developer/admin access required.' }, { status: 403 });
  return t;
}

const slotsPresent = () => KEY_SLOTS.map(s => ({ slot: s, present: !!keyForSlot(s) }));

/** Current key mode + which key slots exist on the server (never the key values). */
export async function GET(request: Request) {
  const who = await staff(request);
  if (who instanceof NextResponse) return who;
  const d = (await adminDb!.collection('system_config').doc('ai_key_mode').get()).data() ?? {};
  return NextResponse.json({
    mode: d.mode === 'single' ? 'single' : 'auto',
    slot: d.mode === 'single' ? Number(d.slot) : null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    updatedBy: d.updatedByEmail ?? null,
    slots: slotsPresent(),
  });
}

/** Body: { mode: 'auto' } or { mode: 'single', slot: 1-6 }. */
export async function POST(request: Request) {
  const who = await staff(request);
  if (who instanceof NextResponse) return who;
  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'single' ? 'single' : body.mode === 'auto' ? 'auto' : null;
  const slot = Number(body.slot);
  if (!mode) return NextResponse.json({ error: 'Choose automatic or one key.' }, { status: 400 });
  if (mode === 'single') {
    if (!KEY_SLOTS.includes(slot as (typeof KEY_SLOTS)[number])) return NextResponse.json({ error: 'Unknown key slot.' }, { status: 400 });
    if (!keyForSlot(slot)) return NextResponse.json({ error: `KEY_${slot} is not set on the server, so it cannot be used.` }, { status: 400 });
  }
  const entry = { mode, slot: mode === 'single' ? slot : null, updatedAt: FieldValue.serverTimestamp(), updatedBy: who.uid, updatedByEmail: who.email ?? null };
  await adminDb!.collection('system_config').doc('ai_key_mode').set(entry);
  await adminDb!.collection('system_config').doc('ai_key_mode').collection('history').add(entry).catch(() => {});
  primeKeyMode(mode, entry.slot ?? undefined); // this server switches now; others within ~15s
  console.log(`[ai-key-mode] set to ${mode === 'single' ? `KEY_${slot} only` : 'automatic'} by ${who.email ?? who.uid}`);
  return NextResponse.json({ ok: true, mode, slot: entry.slot, slots: slotsPresent() });
}
