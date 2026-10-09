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
const { answerKey } = load('src/lib/ielts-listening/answer-key-cam15-test-4.server.ts');
const data = require('../src/lib/ielts-listening/cambridge-15-test-4.json');

test('Cambridge 15 Listening Test 4 has forty questions keyed and grouped into four parts', () => {
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

test('Cambridge 15 Test 4 marking, Croft Valley Park map and A/B/C matching group', () => {
  assert.equal(gradeReadingAnswer('journalist', answerKey[1], 2), true);
  assert.equal(gradeReadingAnswer('23.70', answerKey[5], 2), true);
  assert.equal(gradeReadingAnswer('platforms', answerKey[9], 2), true);
  assert.equal(gradeReadingAnswer('textiles', answerKey[34], 1), true);
  assert.equal(gradeReadingAnswer('advertising', answerKey[40], 1), true);
  assert.equal(gradeReadingAnswer('wrong', answerKey[1], 2), false);

  // Choose-two slots accept either correct letter.
  assert.equal(gradeReadingAnswer('A', answerKey[17], 2), true);
  assert.equal(gradeReadingAnswer('C', answerKey[20], 2), true);

  // Q11–16 is a map block (A–H) with the Croft Valley Park image.
  const map = (data.blocks || []).find(b => b.type === 'map');
  assert.ok(map && map.startId === 11 && map.endId === 16, 'map block covers Q11–16');
  for (let id = 11; id <= 16; id++) {
    const q = data.questions.find(x => x.id === id);
    assert.deepEqual(q.options, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  }

  // Q25–30 is a drag-and-drop matching group (A/B/C).
  const g25 = data.groups['25'];
  assert.ok(g25 && Array.isArray(g25.matchOptions) && g25.matchOptions.length === 3);
  assert.deepEqual(g25.matchOptions.map(o => o.letter), ['A', 'B', 'C']);

  // Firebase-hosted audio for every part.
  for (const s of data.sections) assert.match(s.audio, /^https:\/\/firebasestorage\.googleapis\.com\/.+\?alt=media$/);
});
