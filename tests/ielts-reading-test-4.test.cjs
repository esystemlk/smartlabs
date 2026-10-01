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
const { answerKey } = load('src/lib/ielts-reading/answer-key-test-4.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-11-test-4.json');

test('Test 4 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Test 4 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('false', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('not given', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('vi', answerKey[27], 2), true);
  assert.equal(gradeReadingAnswer('VI', answerKey[27], 2), true);
  assert.equal(gradeReadingAnswer('yes', answerKey[38], 2), true);
  assert.equal(gradeReadingAnswer('true', answerKey[1], 2), false);
});

test('Test 4 summary blocks cover 10-13 and 33-36, and passages are the right length', () => {
  const summaries = data.blocks.filter(b => b.type === 'summary');
  assert.equal(summaries.length, 2);
  const nums1 = [...JSON.stringify(summaries[0].text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums1, [10, 11, 12, 13]);
  const nums2 = [...JSON.stringify(summaries[1].text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums2, [33, 34, 35, 36]);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [12, 9, 6]);
  assert.deepEqual(data.passages[2].paragraphs.map(p => p.ref), ['A', 'B', 'C', 'D', 'E', 'F']);
});
