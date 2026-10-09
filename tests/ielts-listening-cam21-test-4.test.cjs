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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam21-test-4.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-21-test-4.json');

test('Cambridge 21 Listening Test 4 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 21 Test 4 marking and two drag-and-drop matching groups (A–G and A–I)', () => {
  assert.equal(gradeReadingAnswer('Leigh', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('motorbike', answerKey[2], 1), true);
  assert.equal(gradeReadingAnswer('distraction', answerKey[38], 1), true);
  assert.equal(gradeReadingAnswer('volume', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('C', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('B', answerKey[14], 2), true);

  // Q15–20 (speakers → topics, A–G) and Q24–30 (developments → opinions, A–I).
  const g15 = data.groups['15'];
  assert.ok(g15 && Array.isArray(g15.matchOptions) && g15.matchOptions.length === 7);
  assert.deepEqual(g15.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  const g24 = data.groups['24'];
  assert.ok(g24 && Array.isArray(g24.matchOptions) && g24.matchOptions.length === 9);
  assert.deepEqual(g24.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
