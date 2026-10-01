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
const { answerKey } = load('src/lib/ielts-reading/answer-key-test-2.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-11-test-2.json');

test('Test 2 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Test 2 marking accepts variants/casing and rejects wrong or over-length answers', () => {
  assert.equal(gradeReadingAnswer('lifting frame', answerKey[9], 2), true);
  assert.equal(gradeReadingAnswer('frame', answerKey[9], 2), true);
  assert.equal(gradeReadingAnswer('  LIFTING   CRADLE ', answerKey[12], 2), true);
  assert.equal(gradeReadingAnswer('the lifting cradle', answerKey[12], 2), false); // 3 words
  assert.equal(gradeReadingAnswer('true', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('false', answerKey[1], 2), false);
  assert.equal(gradeReadingAnswer('c', answerKey[5], 2), true);
  assert.equal(gradeReadingAnswer('ii', answerKey[14], 2), true);
});

test('Test 2 blocks cover the diagram and summary ranges; diagram image present', () => {
  const diagram = data.blocks.find(b => b.type === 'diagram');
  const summaries = data.blocks.filter(b => b.type === 'summary');
  assert.equal(diagram.startId, 9); assert.equal(diagram.endId, 13);
  const summaryNums = summaries.flatMap(b => [...JSON.stringify(b.text).matchAll(/\{(\d+)\}/g)].map(m => Number(m[1])));
  assert.deepEqual(summaryNums.sort((a, b) => a - b), [21, 22, 23, 24, 31, 32, 33]);
  assert.ok(fs.existsSync(path.join(__dirname, '..', diagram.image.replace(/^\//, 'public/'))));
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [5, 7, 9]);
});
