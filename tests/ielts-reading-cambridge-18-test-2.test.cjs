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
const { answerKey } = load('src/lib/ielts-reading/answer-key-cambridge-18-test-2.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-18-test-2.json');

test('Cambridge 18 Test 2 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Cambridge 18 Test 2 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('posts', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('timber posts', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('true', answerKey[9], 2), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[9], 2), false);
});

test('Cambridge 18 Test 2 summary blocks cover 24-26 and 34-40, passages are the right length', () => {
  const summaries = data.blocks.filter(b => b.type === 'summary');
  const nums1 = [...JSON.stringify(summaries[0].text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  const nums2 = [...JSON.stringify(summaries[1].text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums1, [24, 25, 26]);
  assert.deepEqual(nums2, [34, 35, 36, 37, 38, 39, 40]);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [11, 11, 9]);
});
