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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam15-test-2.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-15-test-2.json');

test('Cambridge 15 Listening Test 2 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 15 Test 2 marking, Minster Park map block and Dickens matching group', () => {
  assert.equal(gradeReadingAnswer('Eustatis', answerKey[1], 1), true);
  assert.equal(gradeReadingAnswer('wires', answerKey[33], 1), true);
  assert.equal(gradeReadingAnswer('fishes', answerKey[38], 1), true);
  assert.equal(gradeReadingAnswer('design', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 1), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('B', answerKey[21], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[24], 2), true);

  // Q15–20 is a map-labelling block (A–I) with the Minster Park image.
  const map = (data.blocks || []).find(b => b.type === 'map');
  assert.ok(map && map.startId === 15 && map.endId === 20, 'map block covers Q15–20');
  for (let id = 15; id <= 20; id++) {
    const q = data.questions.find(x => x.id === id);
    assert.deepEqual(q.options, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  }

  // Q25–30 is a drag-and-drop matching group (A–H).
  const g25 = data.groups['25'];
  assert.ok(g25 && Array.isArray(g25.matchOptions) && g25.matchOptions.length === 8);
  assert.deepEqual(g25.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
