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
const { answerKey } = load('src/lib/ielts-reading/answer-key-cambridge-16-test-4.server.ts');
const data = require('../src/lib/ielts-reading/cambridge-16-test-4.json');

test('Cambridge 16 Test 4 has forty questions keyed and grouped correctly', () => {
  assert.equal(data.questions.length, 40);
  assert.equal(Object.keys(answerKey).length, 40);
  assert.deepEqual(data.questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => i + 1));
  for (const q of data.questions) {
    assert.equal(q.passage, q.id <= 13 ? 0 : q.id <= 26 ? 1 : 2);
    const limit = q.kind === 'choice' ? 2 : q.wordLimit;
    assert.ok(answerKey[q.id].every(a => gradeReadingAnswer(a, answerKey[q.id], limit)), `key ${q.id} should self-grade`);
  }
});

test('Cambridge 16 Test 4 marking accepts variants/casing and rejects wrong answers', () => {
  assert.equal(gradeReadingAnswer('posts', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('harbor', answerKey[13], 2), true);
  assert.equal(gradeReadingAnswer('the harbour', answerKey[13], 2), true);
  assert.equal(gradeReadingAnswer('architect', answerKey[12], 2), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);
});

test('Cambridge 16 Test 4 has two diagram blocks for 1-3 and 4-6, and passages are the right length', () => {
  const diagrams = data.blocks.filter(b => b.type === 'diagram');
  assert.equal(diagrams.length, 2);
  assert.deepEqual(diagrams.map(b => [b.startId, b.endId]), [[1, 3], [4, 6]]);
  assert.ok(diagrams.every(b => fs.existsSync(path.join(__dirname, '..', 'public', b.image))));
  assert.deepEqual(data.passages.map(p => p.paragraphs.length), [7, 9, 6]);
});
