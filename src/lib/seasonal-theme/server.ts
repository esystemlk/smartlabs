import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthed } from '@/lib/api-auth';
import { bundledSeasonalAssetPaths, contrastRatio, presetFor, themeSchema, type SeasonalTheme, type ThemeId } from './config';

export const themeRefs = (id: ThemeId = 'halloween') => ({
  draft: adminDb!.collection('seasonalThemeDrafts').doc(id),
  runtime: adminDb!.collection('seasonalThemeRuntime').doc('current'),
  versions: adminDb!.collection(id === 'halloween' ? 'seasonalThemeVersions' : 'seasonalThemeVersionsChristmas'),
});
export async function verifyThemeAdmin(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return auth;
  if (!['admin', 'developer'].includes(auth.role)) return { ok: false as const, status: 403, error: 'Administrator access required.' };
  return auth;
}
export function readTheme(value: unknown, id: ThemeId = 'halloween') {
  const result = themeSchema.safeParse(value);
  return result.success && result.data.id === id ? result.data : presetFor(id);
}

export function validatePublishedMedia(config: SeasonalTheme) {
  const rawCdn = process.env.NEXT_PUBLIC_BUNNY_HOSTNAME;
  const cdnHost = rawCdn ? new URL(rawCdn.startsWith('https://') ? rawCdn : `https://${rawCdn}`).hostname : '';
  for (const [kind, url] of Object.entries(config.media)) {
    if (!url) continue;
    const extension = kind === 'audio' ? /\.(mp3|ogg)$/i : /\.(png|jpe?g|webp)$/i;
    if (!extension.test(url)) return `Unsupported ${kind} asset format.`;
    if (url.startsWith('https://')) {
      const parsed = new URL(url);
      if (!cdnHost || parsed.hostname !== cdnHost || !parsed.pathname.startsWith(`/images/seasonal/${config.id}/`)) return 'Custom media must come from this theme’s seasonal uploader on your configured CDN.';
    } else if (!bundledSeasonalAssetPaths.includes(url) || !url.startsWith(`/seasonal/${config.id}/`)) return 'Choose a bundled asset for this theme or upload a new file.';
  }
  if (config.branding.logo && (!bundledSeasonalAssetPaths.includes(config.branding.logo) || !config.branding.logo.startsWith(`/seasonal/${config.id}/`))) return 'Use this theme’s bundled seasonal logo.';
  if (config.areas.hero && (!config.media.hero || (config.areas.mobile && !config.media.mobileHero))) return 'Choose desktop and mobile hero artwork before publishing.';
  if (config.areas.palette && [contrastRatio(config.colours.text, config.colours.background), contrastRatio(config.colours.text, config.colours.surface), contrastRatio('#160F24', config.colours.accent)].some(ratio => ratio < 4.5)) return 'Increase the text/background, text/surface, or button contrast to at least 4.5:1.';
  return null;
}
