import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { readTheme, themeRefs, validatePublishedMedia, verifyThemeAdmin } from '@/lib/seasonal-theme/server';
import { themeSchema } from '@/lib/seasonal-theme/config';

export const dynamic = 'force-dynamic';
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: NextRequest) {
  const auth = await verifyThemeAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  try {
    const refs = themeRefs();
    const [draft, runtime, history] = await Promise.all([refs.draft.get(), refs.runtime.get(), refs.versions.orderBy('createdAt', 'desc').limit(15).get()]);
    return json({ config: readTheme(draft.data()?.config), revision: draft.data()?.revision ?? 0, published: runtime.data() ?? null, history: history.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch { return json({ error: 'Could not load seasonal settings.' }, 503); }
}

export async function POST(request: NextRequest) {
  const auth = await verifyThemeAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  try {
    if (Number(request.headers.get('content-length')) > 50_000) return json({ error: 'Settings are too large.' }, 413);
    const body = await request.json();
    const refs = themeRefs();
    if (body.action === 'preview') {
      const config = themeSchema.parse(body.config);
      const issue = validatePublishedMedia(config);
      if (issue) return json({ error: issue }, 400);
      const token = request.headers.get('Authorization')!.slice(7);
      const cookie = await adminAuth!.createSessionCookie(token, { expiresIn: 300_000 });
      await adminDb!.collection('seasonalThemePreviews').doc(auth.uid).set({ config, expiresAt: Date.now() + 300_000 });
      const res = json({ success: true });
      res.cookies.set('sl-seasonal-preview', cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/seasonal-theme', maxAge: 300 });
      return res;
    }
    if (!['save', 'publish', 'off', 'restore'].includes(body.action)) return json({ error: 'Unknown action.' }, 400);
    let config = ['off', 'restore'].includes(body.action) ? null : themeSchema.parse(body.config);
    if (body.action === 'restore') {
      const old = await refs.versions.doc(String(body.versionId)).get();
      if (!old.exists) return json({ error: 'Version not found.' }, 404);
      config = readTheme(old.data()?.config);
    }
    if (body.action === 'publish' && config?.mode === 'manual' && Date.parse(config.manualUntil) <= Date.now()) return json({ error: 'Choose a future manual expiry.' }, 400);
    if (body.action === 'publish' && config) {
      const issue = validatePublishedMedia(config);
      if (issue) return json({ error: issue }, 400);
    }
    const result = await adminDb!.runTransaction(async tx => {
      const [draft, live] = await Promise.all([tx.get(refs.draft), tx.get(refs.runtime)]);
      const revision = draft.data()?.revision ?? 0;
      if (body.action !== 'off' && body.revision !== revision) throw new Error('CONFLICT');
      const now = Date.now();
      if (body.action === 'off') {
        const current = readTheme(live.data()?.config);
        current.mode = 'off';
        const version = refs.versions.doc();
        tx.set(version, { config: current, createdAt: now, createdBy: auth.uid, action: 'off' });
        tx.set(refs.runtime, { config: current, version: version.id, publishedAt: now });
        // Disarm the draft too: the next ordinary publish cannot accidentally re-arm it.
        tx.set(refs.draft, { config: { ...readTheme(draft.data()?.config), mode: 'off' }, revision: revision + 1, updatedAt: now, updatedBy: auth.uid });
        return { revision: revision + 1 };
      }
      tx.set(refs.draft, { config, revision: revision + 1, updatedAt: now, updatedBy: auth.uid });
      if (body.action === 'publish') {
        const version = refs.versions.doc();
        tx.set(version, { config, createdAt: now, createdBy: auth.uid, action: 'publish' });
        tx.set(refs.runtime, { config, version: version.id, publishedAt: now });
      }
      return { revision: revision + 1 };
    });
    return json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFLICT') return json({ error: 'Another administrator changed these settings. Reload before saving.' }, 409);
    if (error instanceof Error && error.name === 'ZodError') return json({ error: 'Invalid settings. Check dates, colours, links and media URLs.' }, 400);
    return json({ error: 'Seasonal settings could not be saved. No success has been assumed.' }, 503);
  }
}
