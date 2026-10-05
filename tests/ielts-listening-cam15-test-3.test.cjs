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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam15-test-3.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-15-test-3.json');

test('Cambridge 15 Listening Test 3 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 15 Test 3 marking and the A/B/C articles matching group', () => {
  assert.equal(gradeReadingAnswer('furniture', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('one year', answerKey[5], 2), true);
  assert.equal(gradeReadingAnswer('graphics', answerKey[23], 1), true);
  assert.equal(gradeReadingAnswer('assumptions', answerKey[26], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('B', answerKey[17], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[20], 2), true);

  // Q27–30 is a drag-and-drop matching group with three options (A–C).
  const g27 = data.groups['27'];
  assert.ok(g27 && Array.isArray(g27.matchOptions) && g27.matchOptions.length === 3);
  assert.deepEqual(g27.matchOptions.map(o => o.letter), ['A', 'B', 'C']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
