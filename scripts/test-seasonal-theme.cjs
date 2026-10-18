// No Firebase connection or website mutation: exercise the actual shared resolver.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/seasonal-theme/config.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require, Date, structuredClone });
const { defaultTheme, themeSchema, resolveTheme, occurrences, eligibleRoute, contrastRatio } = exportsObject;
const config = () => structuredClone(defaultTheme);
const time = value => Date.parse(value);

test('standard appearance is the untouched default, including on Halloween', () => {
  assert.equal(defaultTheme.mode, 'off');
  assert.equal(defaultTheme.areas.sound, false);
  assert.equal(defaultTheme.areas.popup, false);
  assert.equal(resolveTheme(config(), time('2026-10-31T12:00:00+05:30')).active, false);
});
test('annual schedule uses inclusive start and exclusive end in Sri Lanka time', () => {
  const c = config(); c.mode = 'automatic';
  for (const year of [2026, 2027, 2028]) {
    const start = time(`${year}-10-25T00:00:00+05:30`);
    const end = time(`${year}-11-01T00:00:00+05:30`);
    assert.equal(resolveTheme(c, start - 1).active, false);
    assert.equal(resolveTheme(c, start).active, true);
    assert.equal(resolveTheme(c, end - 1).active, true);
    assert.equal(resolveTheme(c, end).active, false);
  }
});
test('year exclusions and one-time campaigns do not reactivate next year', () => {
  const c = config(); c.mode = 'automatic'; c.schedule.excludedYears = [2027];
  assert.equal(resolveTheme(c, time('2027-10-31T12:00:00+05:30')).active, false);
  c.schedule.annual = false;
  assert.equal(resolveTheme(c, time('2028-10-31T12:00:00+05:30')).active, false);
});
test('year-crossing campaigns resolve to their start-year occurrence', () => {
  const c = config(); c.mode = 'automatic'; c.schedule.startMonth = 12; c.schedule.startDay = 28; c.schedule.endMonth = 1; c.schedule.endDay = 3;
  const r = resolveTheme(c, time('2027-01-01T12:00:00+05:30'));
  assert.equal(r.active, true); assert.equal(r.id, 'halloween-2026');
  c.schedule.excludedYears = [2026];
  assert.equal(resolveTheme(c, time('2027-01-01T12:00:00+05:30')).active, false);
});
test('manual expiry is exclusive and does not fall through to automatic', () => {
  const c = config(); c.mode = 'manual'; c.manualUntil = '2026-10-31T12:00:00+05:30';
  assert.equal(resolveTheme(c, time(c.manualUntil) - 1).active, true);
  assert.equal(resolveTheme(c, time(c.manualUntil)).active, false);
  c.mode = 'off';
  assert.equal(resolveTheme(c, time(c.manualUntil) - 1).active, false);
});
test('protected route families remain protected regardless of administrator settings', () => {
  const c = config();
  for (const url of ['/admin/dashboard/seasonal-themes', '/dashboard', '/dashboard/practice/read-aloud', '/payment/success', '/payment-success', '/payment-cancel', '/enroll/course1', '/ai-essay-practice', '/ai-ielts-essay-practice', '/ai-wfd-practice', '/ai-sst-practice', '/swt-trainer', '/mock-tests/pte/test-1', '/mock/abc', '/level-test', '/partners/admin', '/login', '/welcome', '/site-status', '/sl-console-9f3k2x', '/smreg']) assert.equal(eligibleRoute(url, c), false, url);
  for (const url of ['/', '/courses', '/courses/grammar-clinic', '/contact', '/resources', '/blog/article', '/pte-registration']) assert.equal(eligibleRoute(url, c), true, url);
});
test('route exclusions use complete segments, with an explicit whole-site exclusion', () => {
  const c = config(); c.routes.excluded = ['/courses'];
  assert.equal(eligibleRoute('/courses/grammar-clinic', c), false);
  assert.equal(eligibleRoute('/courses-old', c), true);
  c.routes.homeOnly = true;
  assert.equal(eligibleRoute('/', c), true); assert.equal(eligibleRoute('/contact', c), false);
  c.routes.excluded = ['/']; assert.equal(eligibleRoute('/', c), false);
});
test('schema rejects invalid dates, annual leap day, unsafe links, colours and values', () => {
  const mutations = [c => c.schedule.startDay = 32, c => { c.schedule.startMonth = 2; c.schedule.startDay = 29; }, c => c.popup.href = '//evil.example', c => c.media.hero = '/seasonal/../private.png', c => c.media.hero = 'javascript:alert(1)', c => c.colours.text = 'red', c => c.volume = 1, c => c.mode = 'manual', c => c.schedule.startTime = '25:00'];
  for (const mutate of mutations) { const c = config(); mutate(c); assert.equal(themeSchema.safeParse(c).success, false); }
  assert.equal(themeSchema.safeParse(defaultTheme).success, true);
});
test('default text and button contrast meet 4.5:1', () => {
  const c = defaultTheme.colours;
  assert.ok(contrastRatio(c.text, c.background) >= 4.5);
  assert.ok(contrastRatio(c.text, c.surface) >= 4.5);
  assert.ok(contrastRatio('#160F24', c.accent) >= 4.5);
});
test('new yearly occurrences receive distinct popup identity', () => {
  const c = config(); c.mode = 'automatic';
  assert.notEqual(resolveTheme(c, time('2026-10-31')).id, resolveTheme(c, time('2027-10-31')).id);
  assert.ok(occurrences(c, time('2026-10-18')).length >= 3);
});
test('one-time year-crossing dates validate the actual end year', () => {
  const c = config(); c.schedule.annual = false; c.schedule.year = 2028;
  c.schedule.startMonth = 12; c.schedule.startDay = 28; c.schedule.endMonth = 2; c.schedule.endDay = 29;
  assert.equal(themeSchema.safeParse(c).success, false, 'February 2029 has no leap day');
  c.schedule.year = 2027;
  assert.equal(themeSchema.safeParse(c).success, true, 'February 2028 does have a leap day');
});
test('upcoming occurrence lookup continues past several skipped years', () => {
  const c = config(); c.schedule.excludedYears = [2026, 2027, 2028, 2029, 2030];
  const upcoming = occurrences(c, time('2026-10-18')).filter(o => o.end > time('2026-10-18')).slice(0, 3);
  assert.equal(upcoming.length, 3); assert.equal(upcoming[0].id, 'halloween-2031');
});
test('existing published configurations keep their mode and media while gaining placement and logo controls', () => {
  const old = config(); old.mode = 'automatic';
  delete old.characterPlacements; delete old.branding;
  const migrated = themeSchema.parse(old);
  assert.equal(migrated.mode, 'automatic');
  assert.equal(migrated.media.character, old.media.character);
  assert.equal(migrated.characterPlacements.homeCourses, true);
  assert.equal(migrated.branding.logo, '/seasonal/halloween/logo-halloween.webp');
});
