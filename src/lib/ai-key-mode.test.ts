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
  return new Response(JSON.stringify({ error: { message: next === 429 ? 'Resource exhausted' : 'The model is overloaded' } }), { status: next });
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

  // Automatic mode: unchanged — a busy key moves straight on to another key.
  primeKeyMode('auto');
  calls = []; script = [429, 'ok'];
  r = await generateWithFailover(opts);
  assert.notEqual(calls[0].key, calls[1].key, 'auto switches keys');

  // A slot with no key on the server falls back to automatic.
  delete process.env.GOOGLE_GENAI_API_KEY_5;
  primeKeyMode('single', 5);
  calls = []; script = ['ok'];
  r = await generateWithFailover(opts);
  assert.notEqual(r.keyLabel, 'KEY_5');
  console.log('ai-key-mode self-check passed');
})().catch(e => { console.error(e); process.exit(1); });
