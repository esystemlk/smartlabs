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
const { answerKey } = load('src/lib/ielts-reading/answer-key.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-11-test-1.json');
test('all forty questions have a valid key and correct passage grouping', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], q.kind === 'choice' ? 2 : q.wordLimit)));
  }
});
test('marking accepts source variants, casing and whitespace but rejects excess words and omissions', () => {
  assert.equal(gradeReadingAnswer('  URBAN   CENTERS ', answerKey[2], 2), true);
  assert.equal(gradeReadingAnswer('stacked trays', answerKey[6], 2), true);
  assert.equal(gradeReadingAnswer('trays', answerKey[6], 2), true);
  assert.equal(gradeReadingAnswer('the stacked trays', answerKey[6], 2), false);
  assert.equal(gradeReadingAnswer('', answerKey[1], 2), false);
  assert.equal(gradeReadingAnswer('tomato', answerKey[1], 2), false);
  assert.equal(gradeReadingAnswer('not given', answerKey[8], 2), true);
});
test('table contains every completion number exactly once and diagram is present', () => {
  const numbers = [...JSON.stringify(data.table).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
  assert.deepEqual(numbers, [30,31,32,33,34,35,36]);
  assert.ok(fs.existsSync(path.join(__dirname, '../public/images/ielts/reading/falkirk-wheel.png')));
  assert.equal(data.passages[2].paragraphs.length, 8);
});
