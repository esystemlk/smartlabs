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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam14-test-2.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-14-test-2.json');

test('Cambridge 14 Listening Test 2 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 14 Test 2 marking, map block and drag-and-drop matching group', () => {
  assert.equal(gradeReadingAnswer('manager', answerKey[3], 2), true);
  assert.equal(gradeReadingAnswer('three weeks', answerKey[6], 2), true);
  assert.equal(gradeReadingAnswer('H', answerKey[16], 2), true);
  assert.equal(gradeReadingAnswer('telegraph', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[3], 2), false);

  // Part 2 Q16–20 is a plan-labelling map block with letters A–H.
  const map = (data.blocks || []).find(b => b.type === 'map');
  assert.ok(map && map.startId === 16 && map.endId === 20, 'map block covers Q16–20');
  for (let id = 16; id <= 20; id++) {
    const q = data.questions.find(x => x.id === id);
    assert.deepEqual(q.options, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  }

  // Part 3 Q25–30 is a drag-and-drop matching group carrying its options box.
  const mg = data.groups['25'];
  assert.ok(mg && Array.isArray(mg.matchOptions) && mg.matchOptions.length === 8, 'Q25 group has eight match options');
  assert.deepEqual(mg.matchOptions.map(o => o.letter), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
