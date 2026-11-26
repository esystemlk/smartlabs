import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ENTRIES, coordAccess, editable, slipFile } from '@/lib/server/coordinators';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const MAX = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

/** Checks the file really is the type it claims (magic bytes), not just its name. */
function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.subarray(0, 4).toString('hex') === '89504e47') return 'image/png';
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (b.subarray(0, 4).toString() === '%PDF') return 'application/pdf';
  return null;
}

/** POST multipart { id, file } → attach / replace the payment slip of an entry. */
export async function POST(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const form = await request.formData();
  const e = await editable(a, String(form.get('id') || ''));
  if ('error' in e) return NextResponse.json({ error: e.error }, { status: e.status });
  const file = form.get('file');
  if (!(file instanceof File) || file.size < 100 || file.size > MAX) return NextResponse.json({ error: 'Choose a JPG, PNG, WebP or PDF up to 4 MB.' }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return NextResponse.json({ error: 'Choose a JPG, PNG, WebP or PDF up to 4 MB.' }, { status: 415 });
  const path = `coord-slips/${e.ref.id}/${Date.now()}.${TYPES[type]}`;
  await slipFile(path).save(bytes, { resumable: false, metadata: { contentType: type, cacheControl: 'private, no-store' } });
  if (e.data.slipPath) await slipFile(e.data.slipPath).delete({ ignoreNotFound: true }).catch(() => {});
  await e.ref.update({ slipPath: path });
  return NextResponse.json({ ok: true });
}

/** GET ?id= → a 15-minute link to view the slip (owner coordinator or developer). */
export async function GET(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const snap = await adminDb!.collection(ENTRIES).doc(new URL(request.url).searchParams.get('id') || '').get();
  const d = snap.data();
  if (!d || (!a.isDev && d.coordinatorUid !== a.uid) || !d.slipPath) return NextResponse.json({ error: 'No slip.' }, { status: 404 });
  const [url] = await slipFile(d.slipPath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 });
  return NextResponse.json({ url });
}
