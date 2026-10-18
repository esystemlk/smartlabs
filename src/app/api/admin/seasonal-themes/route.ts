import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { readTheme, themeRefs, validatePublishedMedia, verifyThemeAdmin } from '@/lib/seasonal-theme/server';
import { publishedThemes, selectTheme, themeIds, themeSchema, type ThemeId } from '@/lib/seasonal-theme/config';

export const dynamic = 'force-dynamic';
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const validId = (id: unknown): id is ThemeId => themeIds.includes(id as ThemeId);
export async function GET(request: NextRequest) {
  const auth = await verifyThemeAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const id = request.nextUrl.searchParams.get('theme') ?? 'halloween';
  if (!validId(id)) return json({ error: 'Unknown theme.' }, 400);
  try {
    const refs = themeRefs(id);
    const [draft, runtime, history] = await Promise.all([refs.draft.get(), refs.runtime.get(), refs.versions.orderBy('createdAt', 'desc').limit(15).get()]);
    const library = publishedThemes(runtime.data());
    const effective = selectTheme(Object.values(library).map(entry => entry!.config), Date.now());
    return json({ config: readTheme(draft.data()?.config, id), revision: draft.data()?.revision ?? 0, published: library[id] ?? null, library, effective: effective.mode === 'off' ? null : effective.id,
      history: history.docs.map(d => ({ id: d.id, ...d.data(), config: d.data().config })).filter(d => (d.config?.id ?? 'halloween') === id).slice(0, 15) });
  } catch { return json({ error: 'Could not load seasonal settings.' }, 503); }
}

export async function POST(request: NextRequest) {
  const auth = await verifyThemeAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  try {
    if (Number(request.headers.get('content-length')) > 50_000) return json({ error: 'Settings are too large.' }, 413);
    const body = await request.json();
    const id = body.themeId ?? body.config?.id ?? 'halloween';
    if (!validId(id)) return json({ error: 'Unknown theme.' }, 400);
    const refs = themeRefs(id);
    if (body.action === 'preview') {
      const config = themeSchema.parse(body.config);
      if (config.id !== id) return json({ error: 'Theme does not match the selected draft.' }, 400);
      const issue = validatePublishedMedia(config);
      if (issue) return json({ error: issue }, 400);
      const token = request.headers.get('Authorization')!.slice(7);
      const cookie = await adminAuth!.createSessionCookie(token, { expiresIn: 300_000 });
      await adminDb!.collection('seasonalThemePreviews').doc(`${auth.uid}-${id}`).set({ config, expiresAt: Date.now() + 300_000 });
      const res = json({ success: true });
      res.cookies.set('sl-seasonal-preview', cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/seasonal-theme', maxAge: 300 });
      return res;
    }
    if (!['save', 'publish', 'off', 'disable', 'restore'].includes(body.action)) return json({ error: 'Unknown action.' }, 400);
    let config = ['off', 'disable', 'restore'].includes(body.action) ? null : themeSchema.parse(body.config);
    if (body.action === 'restore') {
      const old = await refs.versions.doc(String(body.versionId)).get();
      if (!old.exists) return json({ error: 'Version not found.' }, 404);
      const parsed = themeSchema.safeParse(old.data()?.config);
      if (!parsed.success || parsed.data.id !== id) return json({ error: 'This version belongs to a different theme.' }, 400);
      config = parsed.data;
    }
    if (config && config.id !== id) return json({ error: 'Theme does not match the selected draft.' }, 400);
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
      const library = publishedThemes(live.data());
      const writeRuntime = () => {
        // Preserve the legacy Halloween projection for older clients; reads never migrate data.
        tx.set(refs.runtime, { schemaVersion: 2, themes: library, ...(library.halloween ?? {}), updatedAt: now });
      };
      if (body.action === 'off') {
        const otherId: ThemeId = id === 'halloween' ? 'christmas' : 'halloween';
        const otherRefs = themeRefs(otherId);
        const otherDraft = await tx.get(otherRefs.draft);
        for (const themeId of themeIds) {
          const current = { ...(library[themeId]?.config ?? readTheme(undefined, themeId)), mode: 'off' as const };
          const version = themeRefs(themeId).versions.doc();
          tx.set(version, { config: current, createdAt: now, createdBy: auth.uid, action: 'off' });
          library[themeId] = { config: current, version: version.id, publishedAt: now };
        }
        tx.set(refs.draft, { config: { ...readTheme(draft.data()?.config, id), mode: 'off' }, revision: revision + 1, updatedAt: now, updatedBy: auth.uid });
        tx.set(otherRefs.draft, { config: { ...readTheme(otherDraft.data()?.config, otherId), mode: 'off' }, revision: (otherDraft.data()?.revision ?? 0) + 1, updatedAt: now, updatedBy: auth.uid });
        writeRuntime();
        return { revision: revision + 1 };
      }
      if (body.action === 'disable') config = { ...(library[id]?.config ?? readTheme(draft.data()?.config, id)), mode: 'off' };
      const nextDraft = body.action === 'disable' ? { ...readTheme(draft.data()?.config, id), mode: 'off' as const } : config!;
      tx.set(refs.draft, { config: nextDraft, revision: revision + 1, updatedAt: now, updatedBy: auth.uid });
      if (body.action === 'publish' || body.action === 'disable') {
        const version = refs.versions.doc();
        tx.set(version, { config, createdAt: now, createdBy: auth.uid, action: body.action });
        library[id] = { config: config!, version: version.id, publishedAt: now };
        writeRuntime();
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
