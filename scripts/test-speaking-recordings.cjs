// Isolated route tests: no Firebase, real recordings, AI calls or credits are used.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const docs = new Map(), objects = new Map(), cache = new Map();
let aiCalls = 0, failAI = false, holdAI = null;
const mockScore = { transcript: 'My answer', fluency: 72, pronunciation: 75, overall: 74, fluencyFeedback: 'Steady pace.', pronunciationFeedback: 'Clear speech.', tips: [] };
const snapshot = key => ({ id: key.split('/').pop(), exists: docs.has(key), data: () => docs.get(key) });
const update = (key, values) => { const data = { ...docs.get(key) }; for (const [field, value] of Object.entries(values)) data[field] = value && typeof value === 'object' && 'inc' in value ? (data[field] || 0) + value.inc : value; docs.set(key, data); };
const reference = key => ({ key, collection: name => collection(key + '/' + name), get: async () => snapshot(key), create: async data => { if (docs.has(key)) throw new Error('exists'); docs.set(key, data); }, delete: async () => { docs.delete(key); } });
function collection(key) {
  let before = null, max = Infinity;
  const query = { doc: id => reference(key + '/' + id), orderBy: () => query, limit: count => { max = count; return query; }, startAfter: (time, id) => { before = [time, id]; return query; }, get: async () => {
    const rows = [...docs.entries()].filter(([k]) => k.startsWith(key + '/') && k.slice(key.length + 1).indexOf('/') < 0).sort((a, b) => b[1].createdAt - a[1].createdAt || b[0].localeCompare(a[0])).filter(([k, data]) => !before || data.createdAt < before[0] || (data.createdAt === before[0] && k.split('/').pop() < before[1])).slice(0, max).map(([k]) => snapshot(k));
    return { docs: rows, size: rows.length };
  } };
  return query;
}
const db = { collection, runTransaction: async callback => { const writes = []; const result = await callback({ get: async ref => snapshot(ref.key), update: (ref, data) => writes.push(() => update(ref.key, data)) }); writes.forEach(write => write()); return result; } };
const bucket = { file: key => ({ save: async bytes => { if (objects.has(key)) throw Object.assign(new Error('exists'), { code: 412 }); objects.set(key, Buffer.from(bytes)); }, download: async () => { if (!objects.has(key)) throw new Error('missing'); return [objects.get(key)]; }, delete: async () => { objects.delete(key); } }) };
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  const localRequire = name => {
    if (name === 'server-only') return {};
    if (name === '@/lib/firebase-admin') return { adminDb: db };
    if (name === 'firebase-admin/storage') return { getStorage: () => ({ bucket: () => bucket }) };
    if (name === 'firebase-admin/firestore') return { FieldValue: { increment: inc => ({ inc }) } };
    if (name === '@/lib/api-auth') return { verifyAuthed: async req => { const uid = req.headers.get('Authorization')?.replace('Bearer ', ''); return uid ? { ok: true, uid, role: 'student' } : { ok: false, status: 401, error: 'Sign in.' }; } };
    if (name === '@/ai/flows/score-pte-speaking') return { scorePteSpeaking: async () => { aiCalls++; if (holdAI) await holdAI; if (failAI) throw new Error('AI offline'); return mockScore; } };
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
    return require(name);
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, { exports, require: localRequire, Buffer, Request, Response, File, FormData, Uint8Array, URL, Date, console }, { filename: file });
  cache.set(file, exports); return exports;
}
const api = load('src/app/api/speaking-recordings/route.ts'), audio = load('src/app/api/speaking-recordings/[id]/route.ts'), scoring = load('src/app/api/speaking-recordings/[id]/score/route.ts');
const req = (uid, method = 'GET', body, suffix = '') => new Request('http://localhost/api/speaking-recordings' + suffix, { method, headers: uid ? { Authorization: 'Bearer ' + uid } : {}, ...(body ? { body } : {}) });
const ctx = id => ({ params: Promise.resolve({ id }) });
const bytes = Buffer.alloc(900); bytes.write('RIFF'); bytes.write('WAVE', 8);
function form(id, type = 'audio/wav', content = bytes) { const data = new FormData(); for (const [key, value] of Object.entries({ id, taskType: 'read-aloud', title: 'Read Aloud', questionId: 'ra1', questionLabel: 'Read the passage', promptText: 'My answer', source: 'upload' })) data.set(key, value); data.set('audio', new File([content], 'answer.wav', { type })); return data; }
async function main() {
  docs.set('users/alice', { speakingPaidCredits: 3 }); docs.set('users/bob', { speakingPaidCredits: 0 });
  const id = randomUUID();
  for (const response of [await api.GET(req()), await api.POST(req(null, 'POST', form(id))), await audio.GET(req(), ctx(id)), await audio.DELETE(req(null, 'DELETE'), ctx(id)), await scoring.POST(req(null, 'POST'), ctx(id))]) assert.equal(response.status, 401);
  assert.equal((await api.POST(req('alice', 'POST', form(id, 'audio/wav', Buffer.alloc(900))))).status, 415);
  assert.equal((await api.POST(req('alice', 'POST', form('../bad')))).status, 400);
  assert.equal((await api.POST(req('alice', 'POST', form(id)))).status, 201);
  assert.equal((await api.POST(req('alice', 'POST', form(id)))).status, 200);
  assert.equal(objects.size, 1, 'retry must not duplicate audio');
  assert.equal((await audio.GET(req('bob'), ctx(id))).status, 404);
  assert.equal((await scoring.POST(req('bob', 'POST'), ctx(id))).status, 404);
  assert.deepEqual(Buffer.from(await (await audio.GET(req('alice'), ctx(id))).arrayBuffer()), bytes);
  const list = await (await api.GET(req('alice'))).json(); assert.equal(list.recordings[0].id, id); assert.ok(!('promptText' in list.recordings[0]));
  assert.equal((await scoring.POST(req('alice', 'POST'), ctx(id))).status, 200);
  assert.equal(docs.get('users/alice').speakingPaidCredits, 2);
  assert.equal((await scoring.POST(req('alice', 'POST'), ctx(id))).status, 200); assert.equal(aiCalls, 1, 'saved score must be reused without spending again');
  const failed = randomUUID(); await api.POST(req('alice', 'POST', form(failed))); failAI = true;
  assert.equal((await scoring.POST(req('alice', 'POST'), ctx(failed))).status, 500); failAI = false;
  assert.equal(docs.get('users/alice').speakingPaidCredits, 2, 'failed checking must return reserved credit');
  assert.equal((await audio.GET(req('alice'), ctx(failed))).status, 200, 'AI failure must retain audio');
  const free = randomUUID(); await api.POST(req('bob', 'POST', form(free)));
  assert.equal((await scoring.POST(req('bob', 'POST'), ctx(free))).status, 402); assert.equal((await audio.GET(req('bob'), ctx(free))).status, 200, 'no credit must not block saved playback');
  let release; holdAI = new Promise(resolve => { release = resolve; });
  const pending = scoring.POST(req('alice', 'POST'), ctx(failed));
  while (aiCalls < 3) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal((await scoring.POST(req('alice', 'POST'), ctx(failed))).status, 409); assert.equal((await audio.DELETE(req('alice', 'DELETE'), ctx(failed))).status, 409); release(); await pending; holdAI = null;
  assert.equal((await audio.DELETE(req('bob', 'DELETE'), ctx(id))).status, 200); assert.equal((await audio.GET(req('alice'), ctx(id))).status, 200, 'another account cannot delete an answer');
  assert.equal((await audio.DELETE(req('alice', 'DELETE'), ctx(id))).status, 200); assert.equal((await audio.GET(req('alice'), ctx(id))).status, 404);
  for (let i = 0; i < 25; i++) docs.set('users/alice/speaking_recordings/' + randomUUID(), { taskType: 'read-aloud', createdAt: 1000 + i, status: 'saved' });
  const first = await (await api.GET(req('alice'))).json(); assert.equal(first.recordings.length, 20); assert.ok(first.nextCursor);
  docs.delete('users/alice/speaking_recordings/' + first.recordings[19].id);
  const second = await (await api.GET(req('alice', 'GET', null, '?before=' + encodeURIComponent(first.nextCursor)))).json(); assert.ok(second.recordings.length > 0, 'pagination survives deletion of the last row'); assert.ok(!second.recordings.some(row => first.recordings.some(prior => prior.id === row.id)));
  console.log('Passed: authentication, owner-only audio, file validation, idempotent saving, replay, saved scores, credit reservation/refund, concurrent checking, deletion and stable pagination. No live services used.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
