// Isolated in-memory API tests. Never connects to Firebase or publishes settings.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { exports, require: name => name in imports ? imports[name] : require(name), Date, structuredClone, process, URL, Promise, Number, String, crypto });
  return exports;
}
const cfg = load('src/lib/seasonal-theme/config.ts', {});
const records = new Map();
let serial = 0;
function ref(key) { return { key, id: key.split('/').at(-1), get: async () => ({ exists: records.has(key), data: () => records.get(key) }), set: async value => { records.set(key, structuredClone(value)); } }; }
const refs = { draft: ref('draft/halloween'), runtime: ref('runtime/current'), versions: { doc: id => ref(`versions/${id || ++serial}`) } };
const database = { runTransaction: async callback => {
  const writes = [];
  const result = await callback({ get: r => r.get(), set: (r, value) => writes.push([r.key, structuredClone(value)]) });
  for (const [key, value] of writes) records.set(key, value);
  return result;
}, collection: name => ({ doc: id => ref(`${name}/${id}`) }) };
let identity = { ok: true, uid: 'test-admin', role: 'admin' };
const server = load('src/lib/seasonal-theme/server.ts', {
  'server-only': {}, '@/lib/firebase-admin': { adminDb: database }, '@/lib/api-auth': { verifyAuthed: async () => identity }, './config': cfg,
});
const api = load('src/app/api/admin/seasonal-themes/route.ts', {
  '@/lib/firebase-admin': { adminDb: database, adminAuth: { createSessionCookie: async () => 'isolated-test-cookie' } },
  '@/lib/seasonal-theme/server': { ...server, themeRefs: () => refs }, '@/lib/seasonal-theme/config': cfg,
});
const post = body => api.POST(new Request('http://localhost/api/admin/seasonal-themes', { method: 'POST', headers: { Authorization: 'Bearer isolated-test-token', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
const fresh = () => structuredClone(cfg.defaultTheme);

test('anonymous, student and teacher cannot change the seasonal configuration', async () => {
  for (const candidate of [{ ok: false, status: 401, error: 'Unauthorized' }, { ok: true, uid: 'student', role: 'student' }, { ok: true, uid: 'teacher', role: 'teacher' }]) {
    identity = candidate;
    const response = await post({ action: 'off' });
    assert.equal(response.status, candidate.ok ? 403 : 401);
    assert.equal(records.size, 0);
  }
  identity = { ok: true, uid: 'test-admin', role: 'admin' };
});
test('saving a draft does not publish runtime settings', async () => {
  const response = await post({ action: 'save', config: fresh(), revision: 0 });
  assert.equal(response.status, 200);
  assert.equal(records.get('draft/halloween').revision, 1);
  assert.equal(records.has('runtime/current'), false);
});
test('publishing creates a runtime projection and immutable version', async () => {
  const c = fresh(); c.mode = 'automatic';
  const response = await post({ action: 'publish', config: c, revision: 1 });
  assert.equal(response.status, 200);
  const live = records.get('runtime/current');
  assert.equal(live.config.mode, 'automatic');
  assert.equal(records.get(`versions/${live.version}`).createdBy, 'test-admin');
});
test('a stale revision fails without partial writes', async () => {
  const snapshot = JSON.stringify([...records]);
  const response = await post({ action: 'publish', config: fresh(), revision: 1 });
  assert.equal(response.status, 409);
  assert.equal(JSON.stringify([...records]), snapshot);
});
test('unsafe media hosts, invalid contrast and expired manual activation cannot publish', async () => {
  const revision = records.get('draft/halloween').revision;
  const cases = [c => c.media.hero = 'https://evil.example/hero.webp', c => c.colours.text = c.colours.background, c => { c.mode = 'manual'; c.manualUntil = '2020-10-31T12:00:00+05:30'; }];
  for (const mutate of cases) {
    const c = fresh(); mutate(c);
    const response = await post({ action: 'publish', config: c, revision });
    assert.equal(response.status, 400);
    assert.equal(records.get('draft/halloween').revision, revision);
  }
});
test('all four bundled characters pass publishing validation without allowing unknown local files', () => {
  assert.equal(cfg.halloweenCharacters.length, 4);
  for (const character of cfg.halloweenCharacters) {
    const c = fresh(); c.media.character = character.src;
    assert.equal(server.validatePublishedMedia(c), null, character.name);
    assert.ok(fs.existsSync(path.join(__dirname, '../public', character.src)), character.name);
  }
  const c = fresh(); c.media.character = '/seasonal/halloween/unlisted.webp';
  assert.ok(server.validatePublishedMedia(c));
});
test('preview returns a private cookie without publishing or changing the saved draft', async () => {
  const snapshot = JSON.stringify([...records]);
  const response = await post({ action: 'preview', config: fresh() });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /SameSite=strict/i);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(records.get('runtime/current').config.mode, 'automatic');
  assert.equal(JSON.stringify([...records].filter(([key]) => !key.startsWith('seasonalThemePreviews/'))), snapshot);
});
test('restore standard theme disarms both live state and draft even from a stale panel', async () => {
  const response = await post({ action: 'off', revision: -10 });
  assert.equal(response.status, 200);
  assert.equal(records.get('runtime/current').config.mode, 'off');
  assert.equal(records.get('draft/halloween').config.mode, 'off');
});
test('restoring a previous version changes only the draft', async () => {
  const old = [...records.entries()].find(([key, value]) => key.startsWith('versions/') && value.action === 'publish');
  const live = JSON.stringify(records.get('runtime/current'));
  // Recovery must also work when the currently edited form is invalid.
  const response = await post({ action: 'restore', config: { invalid: true }, versionId: old[0].split('/')[1], revision: records.get('draft/halloween').revision });
  assert.equal(response.status, 200);
  assert.equal(records.get('draft/halloween').config.mode, 'automatic');
  assert.equal(JSON.stringify(records.get('runtime/current')), live);
});
