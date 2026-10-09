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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam20-test-1.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-20-test-1.json');

test('Cambridge 20 Listening Test 1 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 20 Test 1 marking: note completion, MCQ and choose-two groups', () => {
  assert.equal(gradeReadingAnswer('fish', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('30', answerKey[9], 1), true);
  assert.equal(gradeReadingAnswer('average', answerKey[10], 1), true);
  assert.equal(gradeReadingAnswer('factories', answerKey[31], 1), true);
  assert.equal(gradeReadingAnswer('drone', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);

  // Single-answer MCQ.
  assert.equal(gradeReadingAnswer('A', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[30], 2), true);

  // Choose-two slots accept either correct letter in either position.
  assert.equal(gradeReadingAnswer('A', answerKey[17], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[18], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('B', answerKey[25], 2), true);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
