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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam20-test-4.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-20-test-4.json');

test('Cambridge 20 Listening Test 4 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 20 Test 4 marking, variants, choose-two groups and a box-matching group (A–H)', () => {
  assert.equal(gradeReadingAnswer('walking', answerKey[3], 1), true);
  assert.equal(gradeReadingAnswer('combination', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[3], 1), false);

  // Accepted variants for note completion.
  assert.equal(gradeReadingAnswer("King's", answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('Kings', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('2:30', answerKey[8], 1), true);
  assert.equal(gradeReadingAnswer('2.30', answerKey[8], 1), true);

  // Choose-two slots accept either correct letter in either position.
  assert.equal(gradeReadingAnswer('B', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[12], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('A', answerKey[24], 2), true);

  // Single-answer MCQ.
  assert.equal(gradeReadingAnswer('C', answerKey[25], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[30], 2), true);

  // Q15–20 (years → events, A–H) box matching.
  const g15 = data.groups['15'];
  assert.ok(g15 && Array.isArray(g15.matchOptions) && g15.matchOptions.length === 8);
  assert.deepEqual(g15.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  assert.equal(gradeReadingAnswer('D', answerKey[15], 2), true);
  assert.equal(gradeReadingAnswer('G', answerKey[20], 2), true);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
