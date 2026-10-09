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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam20-test-3.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-20-test-3.json');

test('Cambridge 20 Listening Test 3 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 20 Test 3 marking, map labelling (A–G) and box matching (A–F)', () => {
  assert.equal(gradeReadingAnswer('239', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('modern', answerKey[2], 1), true);
  assert.equal(gradeReadingAnswer('temperature', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);

  // Single-answer MCQ.
  assert.equal(gradeReadingAnswer('B', answerKey[11], 2), true);
  assert.equal(gradeReadingAnswer('B', answerKey[26], 2), true);

  // Map labelling Q17–20 (A–G) is driven by a map block.
  const mapBlock = (data.blocks || []).find(b => b.type === 'map');
  assert.ok(mapBlock, 'a map block should exist');
  assert.equal(mapBlock.startId, 17);
  assert.equal(mapBlock.endId, 20);
  assert.match(mapBlock.image, /cambridge-20-test-3-map\.png$/);
  for (let id = 17; id <= 20; id++) {
    assert.deepEqual(data.questions.find(q => q.id === id).options, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  }
  assert.equal(gradeReadingAnswer('G', answerKey[19], 2), true);

  // Q27–30 drag-and-drop matching box (A–F).
  const g27 = data.groups['27'];
  assert.ok(g27 && Array.isArray(g27.matchOptions) && g27.matchOptions.length === 6);
  assert.deepEqual(g27.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.equal(gradeReadingAnswer('F', answerKey[27], 2), true);
  assert.equal(gradeReadingAnswer('D', answerKey[30], 2), true);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
