const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { AsyncLocalStorage } = require('node:async_hooks');
const ts = require('typescript');

const env = Object.fromEntries([1,2,3,4,5,6].map(i => [`GOOGLE_GENAI_API_KEY_${i}`, `test-key-${i}`]));
function load(source, modules, extra = {}) {
  const context = { exports: {}, require: name => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, process: { env: { ...env } }, console: { log() {}, warn() {}, error() {} },
    setTimeout: fn => setTimeout(fn, 0), clearTimeout, Date, URL, Response, ...extra };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  } }).outputText, context);
  return context.exports;
}
function source(file, baseline) {
  return baseline ? execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' }) : fs.readFileSync(file, 'utf8');
}
function genkit(baseline) {
  const scope = load(fs.readFileSync('src/lib/mock-ai-context.ts', 'utf8'), { 'node:async_hooks': { AsyncLocalStorage } });
  const logs = [];
  const engine = load(source('src/ai/genkit.ts', baseline), {
    genkit: { genkit: options => ({ key: options.plugins[0].apiKey, model: options.model }) },
    '@genkit-ai/googleai': { googleAI: options => options },
    '@/lib/mock-ai-context': scope,
    '@/lib/services/ai-usage.service': { logAiCall: async row => logs.push({ key: row.keyIndex, success: row.success, rate: row.isRateLimit }) },
  });
  return { engine, scope, logs };
}
async function genkitTrace(baseline, interleaveMocks = false) {
  const { engine, scope, logs } = genkit(baseline);
  const trace = [];
  for (let i = 0; i < 7; i++) {
    if (interleaveMocks) await scope.withMockAiKey(() => engine.callWithFallback(async ai => {
      assert.equal(ai.key, 'test-key-6'); return 'mock';
    }));
    trace.push(engine.getAi().key);
    trace.push(await engine.callWithFallback(async ai => ai.key));
  }
  const attempts = [];
  trace.push(await engine.callWithFallback(async ai => {
    attempts.push(ai.key);
    if (attempts.length === 1) throw Object.assign(new Error('rate limit'), { status: 429 });
    return ai.key;
  }));
  const transient = [];
  trace.push(await engine.callWithFallback(async ai => {
    transient.push(ai.key);
    if (transient.length < 3) throw Object.assign(new Error('temporarily unavailable'), { status: 503 });
    return ai.key;
  }));
  return { trace, attempts, transient, logs: logs.filter(row => row.key !== 6) };
}
test('individual Genkit rotation, rate-limit fallback, transient retries and logs match Git baseline', async () => {
  assert.deepEqual(await genkitTrace(false), await genkitTrace(true));
});
test('interleaved full mocks do not advance individual practice key rotation or alter its fallback', async () => {
  assert.deepEqual(await genkitTrace(false, true), await genkitTrace(true));
});

async function restTrace(baseline, interleaveMocks = false) {
  const scope = load(fs.readFileSync('src/lib/mock-ai-context.ts', 'utf8'), { 'node:async_hooks': { AsyncLocalStorage } });
  const requests = [];
  let failNext = false;
  const transport = load(source('src/lib/gemini-fetch.ts', baseline), { '@/lib/mock-ai-context': scope }, {
    fetch: async (url, options) => {
      const u = new URL(url); const key = u.searchParams.get('key');
      if (key !== 'test-key-6') requests.push({ key, path: u.pathname, body: options.body });
      if (failNext && key !== 'test-key-6') { failNext = false; return Response.json({ error: { message: 'quota exceeded' } }, { status: 429 }); }
      return Response.json({ candidates: [{ content: { parts: [{ text: '{"mark":7}' }] } }] });
    },
  });
  const opts = { contents: [{ role: 'user', parts: [{ text: 'Unchanged scoring prompt' }] }], systemInstruction: { parts: [{ text: 'Unchanged rubric' }] }, generationConfig: { temperature: 0.2 }, models: [{ name: 'fixture-model', api: 'v1beta' }] };
  const outputs = [];
  for (let i = 0; i < 7; i++) {
    if (interleaveMocks) await scope.withMockAiKey(async () => {
      const r = await transport.generateWithFailover(opts); assert.equal(r.keyIndex, 6);
    });
    if (i === 3) failNext = true;
    outputs.push(JSON.parse(JSON.stringify(await transport.generateWithFailover(opts))));
  }
  return { outputs, requests };
}
test('individual REST key rotation, fallback, model, prompt and generation settings match Git baseline', async () => {
  assert.deepEqual(await restTrace(false), await restTrace(true));
});
test('interleaved mock REST calls never consume or rotate the individual practice key pool', async () => {
  assert.deepEqual(await restTrace(false, true), await restTrace(true));
});
