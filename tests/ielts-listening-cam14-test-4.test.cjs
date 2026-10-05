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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam14-test-4.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-14-test-4.json');

test('Cambridge 14 Listening Test 4 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 14 Test 4 marking and three drag-and-drop matching groups', () => {
  assert.equal(gradeReadingAnswer('85', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[8], 2), true);
  assert.equal(gradeReadingAnswer('cameras', answerKey[37], 1), true);
  assert.equal(gradeReadingAnswer('camera', answerKey[37], 1), true);
  assert.equal(gradeReadingAnswer('wine', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('B', answerKey[17], 2), true);
  assert.equal(gradeReadingAnswer('D', answerKey[18], 2), true);
  assert.equal(gradeReadingAnswer('A', answerKey[19], 2), true);

  // Three matching groups: Q8–10 (A–C), Q11–16 (A–H), Q26–30 (A–G).
  assert.deepEqual(data.groups['8'].matchOptions.map(o => o.letter), ['A', 'B', 'C']);
  assert.deepEqual(data.groups['11'].matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  assert.deepEqual(data.groups['26'].matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
