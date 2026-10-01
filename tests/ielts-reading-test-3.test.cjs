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
const { answerKey } = load('src/lib/ielts-reading/answer-key-test-3.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-11-test-3.json');

test('Test 3 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Test 3 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('TEA', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('corridor', answerKey[26], 1), true);
  assert.equal(gradeReadingAnswer('passageway', answerKey[26], 1), true);
  assert.equal(gradeReadingAnswer('not given', answerKey[13], 2), true);
  assert.equal(gradeReadingAnswer('g', answerKey[19], 2), true);
  assert.equal(gradeReadingAnswer('silk', answerKey[1], 1), false);
});

test('Test 3 summary block covers 23–26 and passages are the right length', () => {
  const summary = data.blocks.find(b => b.type === 'summary');
  const nums = [...JSON.stringify(summary.text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums, [23, 24, 25, 26]);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [6, 8, 12]);
});
