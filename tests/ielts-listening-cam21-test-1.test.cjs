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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam21-test-1.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-21-test-1.json');

test('Cambridge 21 Listening Test 1 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 21 Test 1 marking and two drag-and-drop matching groups', () => {
  assert.equal(gradeReadingAnswer('ten', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('cafe', answerKey[8], 1), true);
  assert.equal(gradeReadingAnswer('metals', answerKey[31], 1), true);
  assert.equal(gradeReadingAnswer('soil', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[2], 2), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('B', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[24], 2), true);

  // Q17–20 (duties → abilities, A–C) and Q25–30 (resources → opinions, A–H).
  const g17 = data.groups['17'];
  assert.ok(g17 && Array.isArray(g17.matchOptions) && g17.matchOptions.length === 3);
  assert.deepEqual(g17.matchOptions.map(o => o.letter), ['A', 'B', 'C']);
  const g25 = data.groups['25'];
  assert.ok(g25 && Array.isArray(g25.matchOptions) && g25.matchOptions.length === 8);
  assert.deepEqual(g25.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
