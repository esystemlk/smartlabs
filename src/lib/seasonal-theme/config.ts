import { z } from 'zod';

export const halloweenCharacters = [
  { id: 'ghost', name: 'Ghost scholar', src: '/seasonal/halloween/ghost.webp' },
  { id: 'wizard-owl', name: 'Wizard owl', src: '/seasonal/halloween/wizard-owl.webp' },
  { id: 'witch-cat', name: 'Witch kitten', src: '/seasonal/halloween/witch-cat.webp' },
  { id: 'book-bat', name: 'Book bat', src: '/seasonal/halloween/book-bat.webp' },
  { id: 'pumpkin-robot', name: 'Pumpkin robot', src: '/seasonal/halloween/pumpkin-robot.webp' },
  { id: 'witch-fox', name: 'Witch fox', src: '/seasonal/halloween/witch-fox.webp' },
  { id: 'mummy-bunny', name: 'Mummy bunny', src: '/seasonal/halloween/mummy-bunny.webp' },
] as const;

export const themeIds = ['halloween', 'christmas'] as const;
export type ThemeId = typeof themeIds[number];
export const themeLabel = (id: ThemeId) => id === 'christmas' ? 'Christmas' : 'Halloween';
export const christmasCharacters = halloweenCharacters.map((character, index) => ({
  id: character.id, name: ['Christmas ghost scholar', 'Santa owl', 'Christmas kitten', 'Festive book bat', 'Christmas robot', 'Christmas fox', 'Christmas bunny'][index],
  src: character.src.replace('/halloween/', '/christmas/'),
}));
export const charactersFor = (id: ThemeId) => id === 'christmas' ? christmasCharacters : halloweenCharacters;

export const bundledSeasonalAssetPaths: readonly string[] = [
  '/seasonal/halloween/hero.webp', '/seasonal/halloween/hero-mobile.webp',
  '/seasonal/halloween/footer.webp', ...halloweenCharacters.map(character => character.src),
  '/seasonal/halloween/logo-halloween.webp',
  '/seasonal/christmas/hero.webp', '/seasonal/christmas/hero-mobile.webp', '/seasonal/christmas/footer.webp',
  '/seasonal/christmas/popup.webp', '/seasonal/christmas/logo-christmas.webp', ...christmasCharacters.map(character => character.src),
];

const colour = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const asset = z.string().max(600).refine(value => {
  if (!value) return true;
  if (/^\/seasonal\/[a-zA-Z0-9/_.-]+$/.test(value)) return !value.split('/').includes('..');
  return /^https:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9/_.%-]+$/.test(value);
}, 'Use a seasonal asset or an HTTPS media URL');
const path = z.string().max(180).regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/, 'Choose an internal website path');
export const defaultCharacterPlacements = {
  homeIntro: true, homeCourses: true, homeSupport: true,
  pageIntro: true, pageEnd: true, footer: true, mobile: true,
};
export const themeSchema = z.object({
  id: z.enum(themeIds).default('halloween'),
  priority: z.number().int().min(0).max(100).default(10),
  name: z.string().trim().min(1).max(80),
  mode: z.enum(['off', 'automatic', 'manual']),
  manualUntil: z.string().max(40),
  schedule: z.object({
    annual: z.boolean(), year: z.number().int().min(2026).max(2100),
    startMonth: z.number().int().min(1).max(12), startDay: z.number().int().min(1).max(31),
    endMonth: z.number().int().min(1).max(12), endDay: z.number().int().min(1).max(31),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    excludedYears: z.array(z.number().int().min(2026).max(2100)).max(75),
  }),
  colours: z.object({ background: colour, surface: colour, text: colour, accent: colour, secondary: colour }),
  areas: z.object({ palette: z.boolean(), header: z.boolean(), hero: z.boolean(), footer: z.boolean(), characters: z.boolean(), animations: z.boolean(), popup: z.boolean(), sound: z.boolean(), mobile: z.boolean() }),
  characterPlacements: z.object({ homeIntro: z.boolean(), homeCourses: z.boolean(), homeSupport: z.boolean(), pageIntro: z.boolean(), pageEnd: z.boolean(), footer: z.boolean(), mobile: z.boolean() }).default(defaultCharacterPlacements),
  branding: z.object({ enabled: z.boolean(), logo: asset }).default({ enabled: true, logo: '/seasonal/halloween/logo-halloween.webp' }),
  media: z.object({ hero: asset, mobileHero: asset, character: asset, footer: asset, popup: asset, audio: asset }),
  hero: z.object({ greeting: z.string().max(80), title: z.string().trim().min(1).max(120), body: z.string().max(350), primaryLabel: z.string().trim().min(1).max(40), primaryHref: path, secondaryLabel: z.string().trim().min(1).max(40), secondaryHref: path, overlay: z.number().min(0.15).max(0.9), characterSize: z.number().min(80).max(280), characterPosition: z.enum(['left', 'right']) }),
  motion: z.enum(['low', 'medium']),
  effects: z.object({ heroMotion: z.boolean(), bats: z.boolean(), batScope: z.enum(['hero', 'home', 'site']), mobile: z.boolean(), snow: z.boolean().default(false), snowScope: z.enum(['hero', 'home', 'site']).default('hero'), sleigh: z.boolean().default(false) }).default({ heroMotion: true, bats: true, batScope: 'hero', mobile: false, snow: false, snowScope: 'hero', sleigh: false }),
  volume: z.number().min(0).max(0.25),
  popup: z.object({ title: z.string().trim().min(1).max(100), body: z.string().max(400), button: z.string().max(40), href: path, delay: z.number().int().min(12).max(120), frequency: z.enum(['session', 'daily', 'occurrence']), expiresAt: z.string().max(40).refine(value => !value || Number.isFinite(Date.parse(value)), 'Choose a valid expiry') }),
  routes: z.object({ excluded: z.array(path).max(50), homeOnly: z.boolean() }),
}).superRefine((value, ctx) => {
  const s = value.schedule;
  const calendarKey = (month: number, day: number, time: string) => (month * 32 + day) * 1440 + Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const endsNextYear = calendarKey(s.endMonth, s.endDay, s.endTime) <= calendarKey(s.startMonth, s.startDay, s.startTime);
  for (const [month, day, field, year] of [[s.startMonth, s.startDay, 'startDay', s.year], [s.endMonth, s.endDay, 'endDay', s.year + (endsNextYear ? 1 : 0)]] as const) {
    // Annual dates must be valid in every year, including non-leap years.
    const d = new Date(Date.UTC(s.annual ? 2027 : year, month - 1, day));
    if (d.getUTCMonth() !== month - 1) ctx.addIssue({ code: 'custom', path: ['schedule', field], message: 'Invalid calendar date' });
  }
  if (s.startMonth === s.endMonth && s.startDay === s.endDay && s.startTime === s.endTime) ctx.addIssue({ code: 'custom', path: ['schedule'], message: 'Start and end must differ' });
  if (value.mode === 'manual' && !Number.isFinite(Date.parse(value.manualUntil))) ctx.addIssue({ code: 'custom', path: ['manualUntil'], message: 'Manual mode needs a valid expiry' });
});
export type SeasonalTheme = z.infer<typeof themeSchema>;
export const defaultTheme: SeasonalTheme = {
  id: 'halloween', priority: 10,
  name: 'Enchanted Learning Lab', mode: 'off', manualUntil: '',
  schedule: { annual: true, year: 2026, startMonth: 10, startDay: 25, endMonth: 11, endDay: 1, startTime: '00:00', endTime: '00:00', excludedYears: [] },
  colours: { background: '#160F24', surface: '#261A38', text: '#FFF6E8', accent: '#FF9A3D', secondary: '#C7A6FF' },
  areas: { palette: true, header: true, hero: true, footer: true, characters: true, animations: true, popup: false, sound: false, mobile: true },
  characterPlacements: { ...defaultCharacterPlacements },
  branding: { enabled: true, logo: '/seasonal/halloween/logo-halloween.webp' },
  media: { hero: '/seasonal/halloween/hero.webp', mobileHero: '/seasonal/halloween/hero-mobile.webp', character: '/seasonal/halloween/ghost.webp', footer: '/seasonal/halloween/footer.webp', popup: '/seasonal/halloween/hero.webp', audio: '' },
  hero: { greeting: 'A little magic for your learning journey', title: 'Big dreams.\nA little learning magic.', body: 'Build your confidence in English with expert-led PTE, IELTS and Cambridge preparation, plus AI-powered practice.', primaryLabel: 'Explore PTE courses', primaryHref: '/pte-registration', secondaryLabel: 'Find our courses', secondaryHref: '/courses', overlay: 0.65, characterSize: 160, characterPosition: 'right' },
  motion: 'low', volume: 0.08,
  effects: { heroMotion: true, bats: true, batScope: 'hero', mobile: false, snow: false, snowScope: 'hero', sleigh: false },
  popup: { title: 'A little Halloween learning magic', body: 'Keep your goals glowing. Explore Smart Labs courses this Halloween.', button: 'Explore courses', href: '/courses', delay: 12, frequency: 'occurrence', expiresAt: '' },
  routes: { excluded: [], homeOnly: false },
};

export const christmasTheme: SeasonalTheme = {
  ...structuredClone(defaultTheme), id: 'christmas', priority: 20, name: 'Christmas Learning Village',
  schedule: { ...defaultTheme.schedule, startMonth: 12, startDay: 1, endMonth: 1, endDay: 1 },
  colours: { background: '#0C2020', surface: '#163532', text: '#FFF7E8', accent: '#F6C66A', secondary: '#A9DCE8' },
  branding: { enabled: true, logo: '/seasonal/christmas/logo-christmas.webp' },
  media: { hero: '/seasonal/christmas/hero.webp', mobileHero: '/seasonal/christmas/hero-mobile.webp', character: '/seasonal/christmas/ghost.webp', footer: '/seasonal/christmas/footer.webp', popup: '/seasonal/christmas/popup.webp', audio: '' },
  hero: { ...defaultTheme.hero, title: 'Bright minds.\nA season of possibility.', greeting: 'A little Christmas magic for your learning journey' },
  effects: { heroMotion: true, bats: false, batScope: 'hero', mobile: false, snow: true, snowScope: 'site', sleigh: false },
  popup: { ...defaultTheme.popup, title: 'Give your goals a bright new chapter', body: 'Keep learning this Christmas. Explore expert-led courses and smart practice at Smart Labs.' },
};
export const presetFor = (id: ThemeId) => structuredClone(id === 'christmas' ? christmasTheme : defaultTheme);
export type PublishedTheme = { config: SeasonalTheme; version: string; publishedAt: number };
export function publishedThemes(value: unknown): Partial<Record<ThemeId, PublishedTheme>> {
  if (!value || typeof value !== 'object') return {};
  const data = value as Record<string, unknown>;
  const entries = data.themes && typeof data.themes === 'object' ? data.themes as Record<string, unknown> : { halloween: data };
  const result: Partial<Record<ThemeId, PublishedTheme>> = {};
  for (const id of themeIds) {
    const entry = entries[id] as Record<string, unknown> | undefined;
    const parsed = themeSchema.safeParse(entry?.config);
    if (parsed.success && parsed.data.id === id) result[id] = { config: parsed.data, version: typeof entry?.version === 'string' ? entry.version : '', publishedAt: typeof entry?.publishedAt === 'number' ? entry.publishedAt : 0 };
  }
  return result;
}
export function selectTheme(configs: SeasonalTheme[], now: number) {
  return configs.filter(config => resolveTheme(config, now).active).sort((a, b) => Number(b.mode === 'manual') - Number(a.mode === 'manual') || b.priority - a.priority || a.id.localeCompare(b.id))[0] ?? defaultTheme;
}

const protectedPrefixes = ['/admin', '/dashboard', '/api', '/payment', '/payment-success', '/payment-cancel', '/enroll', '/mock', '/mock-tests', '/ai-essay-practice', '/ai-ielts-essay-practice', '/ai-sst-practice', '/ai-wfd-practice', '/swt-trainer', '/level-test', '/partners', '/credits', '/my-purchases', '/login', '/signup', '/forgot-password', '/welcome', '/site-status', '/sl-console-9f3k2x', '/smreg'];
export const matchesPath = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
export function eligibleRoute(pathname: string, config: SeasonalTheme) {
  return !protectedPrefixes.some(prefix => matchesPath(pathname, prefix)) && !config.routes.excluded.some(prefix => prefix === '/' || matchesPath(pathname, prefix)) && (!config.routes.homeOnly || pathname === '/');
}

// Asia/Colombo has a fixed +05:30 offset. Calendar rules are intentionally
// limited to this timezone instead of pretending arbitrary DST support.
function boundary(year: number, month: number, day: number, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes) - 330 * 60_000;
}
export function occurrences(config: SeasonalTheme, now: number) {
  const s = config.schedule;
  const year = new Date(now + 330 * 60_000).getUTCFullYear();
  const years = s.annual ? Array.from({ length: Math.max(0, 2100 - year + 2) }, (_, index) => year - 1 + index) : [s.year];
  return years.filter(y => !s.excludedYears.includes(y)).map(y => {
    const start = boundary(y, s.startMonth, s.startDay, s.startTime);
    let end = boundary(y, s.endMonth, s.endDay, s.endTime);
    if (end <= start) end = boundary(y + 1, s.endMonth, s.endDay, s.endTime);
    return { id: `${config.id}-${y}`, start, end };
  });
}
export function resolveTheme(config: SeasonalTheme, now: number, preview = false) {
  if (preview) return { active: true, id: 'preview', end: now + 300_000 };
  if (config.mode === 'off') return { active: false, id: '', end: 0 };
  if (config.mode === 'manual') return { active: Date.parse(config.manualUntil) > now, id: `manual-${config.manualUntil}`, end: Date.parse(config.manualUntil) || 0 };
  const current = occurrences(config, now).find(o => now >= o.start && now < o.end);
  return { active: !!current, id: current?.id ?? '', end: current?.end ?? 0 };
}

export function contrastRatio(first: string, second: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
