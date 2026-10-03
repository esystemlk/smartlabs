const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').replace("import 'server-only';", '');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  return exports;
}
const { gradeReadingAnswer } = load('src/lib/ielts-reading/grading.ts');
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam11-test-4.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-11-test-4.json');

test('Listening Test 4 has forty questions keyed and grouped into four parts', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  assert.equal(data.sections.length, 4);
  for (const q of data.questions) {
    assert.equal(q.part, q.id <= 10 ? 1 : q.id <= 20 ? 2 : q.id <= 30 ? 3 : 4);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Listening Test 4 marking, map block and audio files', () => {
  assert.equal(gradeReadingAnswer('SECONDARY', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('sugars', answerKey[33], 1), true);
  assert.equal(gradeReadingAnswer('damp', answerKey[35], 1), true);
  assert.equal(gradeReadingAnswer('d', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('h', answerKey[18], 2), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);
  const map = data.blocks.find(b => b.type === 'map');
  assert.equal(map.startId, 17); assert.equal(map.endId, 20);
  assert.ok(fs.existsSync(path.join(__dirname, '..', map.image.replace(/^\//, 'public/'))));
  for (const s of data.sections) assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', s.audio.replace(/^\//, ''))), `missing audio: ${s.audio}`);
});
