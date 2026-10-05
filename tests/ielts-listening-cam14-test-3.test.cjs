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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam14-test-3.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-14-test-3.json');

test('Cambridge 14 Listening Test 3 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 14 Test 3 marking and two drag-and-drop matching groups', () => {
  assert.equal(gradeReadingAnswer('Tesla', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('45', answerKey[5], 2), true);
  assert.equal(gradeReadingAnswer('F', answerKey[15], 2), true);
  assert.equal(gradeReadingAnswer('Olympics', answerKey[40], 2), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);

  // Both choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('A', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('E', answerKey[12], 2), true);

  // Q15–20 (Volunteers, A–G) and Q27–30 (Band members, A–F) are matching groups.
  const g15 = data.groups['15'];
  assert.ok(g15 && Array.isArray(g15.matchOptions) && g15.matchOptions.length === 7);
  assert.deepEqual(g15.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  const g27 = data.groups['27'];
  assert.ok(g27 && Array.isArray(g27.matchOptions) && g27.matchOptions.length === 6);
  assert.deepEqual(g27.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
