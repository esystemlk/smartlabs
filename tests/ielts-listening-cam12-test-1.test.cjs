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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam12-test-1.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-12-test-1.json');

test('Cambridge 12 Listening Test 1 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 12 Test 1 marking and audio files', () => {
  assert.equal(gradeReadingAnswer('MOUNTAINS', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('267', answerKey[10], 2), true);
  assert.equal(gradeReadingAnswer('side effects', answerKey[32], 2), true);
  assert.equal(gradeReadingAnswer('market share', answerKey[40], 2), true);
  assert.equal(gradeReadingAnswer('e', answerKey[15], 2), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
