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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam20-test-2.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-20-test-2.json');

test('Cambridge 20 Listening Test 2 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 20 Test 2 marking, variants and two drag-and-drop matching groups (A–I and A–G)', () => {
  assert.equal(gradeReadingAnswer('break', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('insurance', answerKey[9], 1), true);
  assert.equal(gradeReadingAnswer('soil', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);

  // Accepted variants for note completion.
  assert.equal(gradeReadingAnswer('photographs', answerKey[31], 1), true);
  assert.equal(gradeReadingAnswer('pictures', answerKey[31], 1), true);
  assert.equal(gradeReadingAnswer('cooks', answerKey[33], 1), true);
  assert.equal(gradeReadingAnswer('reporters', answerKey[34], 1), true);
  assert.equal(gradeReadingAnswer('cost', answerKey[39], 1), true);

  // Single-answer MCQ.
  assert.equal(gradeReadingAnswer('B', answerKey[17], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[30], 2), true);

  // Q11–16 (activities → roles, A–I) and Q21–25 (aspects → opinions, A–G).
  const g11 = data.groups['11'];
  assert.ok(g11 && Array.isArray(g11.matchOptions) && g11.matchOptions.length === 9);
  assert.deepEqual(g11.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  const g21 = data.groups['21'];
  assert.ok(g21 && Array.isArray(g21.matchOptions) && g21.matchOptions.length === 7);
  assert.deepEqual(g21.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.equal(gradeReadingAnswer('D', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('I', answerKey[12], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[25], 2), true);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
