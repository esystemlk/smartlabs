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
const { answerKey } = load('src/lib/ielts-reading/answer-key-cambridge-18-test-1.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-18-test-1.json');

test('Cambridge 18 Test 1 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Cambridge 18 Test 1 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('1,000 kg', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('1000 kg', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('flavor', answerKey[7], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[2], 2), false);
});

test('Cambridge 18 Test 1 summary block covers 32-35 and passages are the right length', () => {
  const summary = data.blocks.find(b => b.type === 'summary');
  const nums = [...JSON.stringify(summary.text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums, [32, 33, 34, 35]);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [6, 7, 6]);
});
