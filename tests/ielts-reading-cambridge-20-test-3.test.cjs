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
const { answerKey } = load('src/lib/ielts-reading/answer-key-cambridge-20-test-3.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-20-test-3.json');

test('Cambridge 20 Test 3 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Cambridge 20 Test 3 marking accepts variants/casing and choose-two pairs', () => {
  assert.equal(gradeReadingAnswer('C', answerKey[20], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('color', answerKey[26], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[20], 2), false);
});

test('Cambridge 20 Test 3 has no summary blocks and passages are the right length', () => {
  assert.equal((data.blocks || []).length, 0);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [11, 6, 12]);
});
