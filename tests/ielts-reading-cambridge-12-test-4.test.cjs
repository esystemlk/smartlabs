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
const { answerKey } = load('src/lib/ielts-reading/answer-key-cambridge-12-test-4.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-12-test-4.json');

test('Cambridge 12 Test 4 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Cambridge 12 Test 4 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('OBSIDIAN', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('shareholders', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('investors', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('not given', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('viii', answerKey[30], 2), true);
  assert.equal(gradeReadingAnswer('glass', answerKey[1], 1), false);
});

test('Cambridge 12 Test 4 summary block covers 19-22 and passages are the right length', () => {
  const summary = data.blocks.find(b => b.type === 'summary');
  const nums = [...JSON.stringify(summary.text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(nums, [19, 20, 21, 22]);
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [7, 9, 7]);
  assert.deepEqual(data.passages[2].paragraphs.map(p => p.ref), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
});
