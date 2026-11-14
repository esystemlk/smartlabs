// Self-check for the admin single-key switch in gemini-fetch. Fake keys and a fake Gemini; no network.
// Run: npx tsx src/lib/ai-key-mode.test.ts
import assert from 'node:assert/strict';
import { primeKeyMode } from './ai-key-mode';
import { generateWithFailover, AiBusyError } from './gemini-fetch';

for (let i = 1; i <= 6; i++) process.env[`GOOGLE_GENAI_API_KEY_${i}`] = `fake-key-${i}`;

let calls: { key: string; model: string }[] = [];
let script: Array<number | 'ok'> = [];
globalThis.fetch = (async (url: string) => {
  const key = new URL(url).searchParams.get('key')!;
  const model = url.split('/models/')[1].split(':')[0];
  calls.push({ key, model });
  const next = script.shift() ?? 'ok';
  if (next === 'ok') return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'hello' }] } }] }), { status: 200 });
  const message = next === 429 ? 'Resource exhausted' : next === 404 ? 'models/x is not found for API version v1beta' : 'The model is overloaded';
  return new Response(JSON.stringify({ error: { message } }), { status: next });
}) as typeof fetch;

const opts = { contents: [{ role: 'user', parts: [{ text: 'hi' }] }], deadlineMs: 30_000 };

(async () => {
  // Single mode: only KEY_3, a rate limit is waited out and retried on the SAME key.
  primeKeyMode('single', 3);
  calls = []; script = [429, 'ok'];
  let r = await generateWithFailover(opts);
  assert.equal(r.keyLabel, 'KEY_3');
  assert.deepEqual(calls.map(c => c.key), ['fake-key-3', 'fake-key-3']);
  assert.equal(calls[0].model, calls[1].model, 'retried the same model');

  // Single mode: a model that stays busy moves to the next MODEL, still on KEY_3.
  calls = []; script = [503, 503, 503, 'ok'];
  r = await generateWithFailover(opts);
  assert.ok(calls.every(c => c.key === 'fake-key-3'), 'never used another key');
  assert.notEqual(calls[3].model, calls[0].model, 'moved to the next model');
  assert.equal(r.keyIndex, 3);

  // Single mode: if everything stays busy, it gives up with AiBusyError and never touches other keys.
  calls = []; script = Array(20).fill(429);
  await assert.rejects(generateWithFailover({ ...opts, deadlineMs: 8_000 }), AiBusyError);
  assert.ok(calls.length > 0 && calls.every(c => c.key === 'fake-key-3'));

  // Automatic: the paid KEY_6 goes first, on the first approved model.
  primeKeyMode('auto');
  calls = []; script = ['ok'];
  r = await generateWithFailover(opts);
  assert.deepEqual(calls[0], { key: 'fake-key-6', model: 'gemini-flash-latest' });

  // Automatic: a busy KEY_6 model gets one retry, then the NEXT MODEL on KEY_6 (not another key).
  calls = []; script = [503, 503, 'ok'];
  r = await generateWithFailover(opts);
  assert.deepEqual(calls.map(c => c.key), ['fake-key-6', 'fake-key-6', 'fake-key-6']);
  assert.deepEqual(calls.map(c => c.model), ['gemini-flash-latest', 'gemini-flash-latest', 'gemini-pro-latest']);

  // Automatic: only the approved ladder is ever used on KEY_6, and the free keys come after it.
  calls = []; script = [404, 404, 404, 404, 404, 'ok'];
  r = await generateWithFailover(opts);
  assert.deepEqual(calls.slice(0, 5).map(c => c.model), ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-3.8-flash']);
  assert.ok(calls.slice(0, 5).every(c => c.key === 'fake-key-6'));
  assert.notEqual(calls[5].key, 'fake-key-6', 'falls back to a free key after the whole ladder');

  // Without KEY_6, free keys behave as before: a busy key moves straight on to another key.
  const k6 = process.env.GOOGLE_GENAI_API_KEY_6; delete process.env.GOOGLE_GENAI_API_KEY_6;
  calls = []; script = [429, 'ok'];
  r = await generateWithFailover(opts);
  assert.notEqual(calls[0].key, calls[1].key, 'free keys switch on busy');
  process.env.GOOGLE_GENAI_API_KEY_6 = k6;

  // One-key mode on KEY_6 walks the same approved ladder.
  primeKeyMode('single', 6);
  calls = []; script = [404, 'ok'];
  r = await generateWithFailover(opts);
  assert.deepEqual(calls.map(c => c.model), ['gemini-flash-latest', 'gemini-pro-latest']);
  primeKeyMode('auto');

  // A slot with no key on the server falls back to automatic.
  delete process.env.GOOGLE_GENAI_API_KEY_5;
  primeKeyMode('single', 5);
  calls = []; script = ['ok'];
  r = await generateWithFailover(opts);
  assert.notEqual(r.keyLabel, 'KEY_5');
  console.log('ai-key-mode self-check passed');
})().catch(e => { console.error(e); process.exit(1); });
