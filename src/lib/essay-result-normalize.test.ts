// Self-check for essay result cleaning. Run: npx tsx src/lib/essay-result-normalize.test.ts
import assert from 'node:assert/strict';
import { normalizeEssayResult } from './essay-result-normalize';

// The shape that crashed the page: {basic, better} objects inside text lists.
const bad = {
  strengths: ['Clear thesis', { basic: 'good', better: 'beneficial' }],
  vocabularyCollocations: { impreciseWords: [{ basic: 'big', better: 'substantial' }], strongVocabulary: ['mitigate'] },
  improvementPlan: { strategicTips: [{ tip: 'Use examples', why: 'support' }], top5Weaknesses: [], sentenceCorrections: [{ original: 'a', improved: 'b' }] },
  vocabUpgrades: ['nice', { basic: 'show', better: 'demonstrate' }],
  summaryText: { text: 'Solid essay' },
  criteria: [{ name: 'Content', score: 5, max: 6 }],
};
const r = normalizeEssayResult(bad as never) as unknown as typeof bad & Record<string, unknown>;
assert.deepEqual(r.strengths, ['Clear thesis', 'good → beneficial']);
assert.deepEqual(r.vocabularyCollocations.impreciseWords, ['big → substantial']);
assert.deepEqual(r.vocabularyCollocations.strongVocabulary, ['mitigate']);
assert.deepEqual(r.improvementPlan.strategicTips, ['Use examples — support']);
// Lists that are meant to hold objects are left alone.
assert.deepEqual(r.improvementPlan.sentenceCorrections, [{ original: 'a', improved: 'b' }]);
assert.deepEqual(r.criteria, [{ name: 'Content', score: 5, max: 6 }]);
assert.deepEqual(r.vocabUpgrades, [{ basic: 'nice', better: '' }, { basic: 'show', better: 'demonstrate' }]);
assert.equal(r.summaryText, 'Solid essay');
// Everything in a text list is now a string, so React can render it.
for (const v of [...r.strengths, ...r.vocabularyCollocations.impreciseWords, ...r.improvementPlan.strategicTips]) assert.equal(typeof v, 'string');
// A clean result passes through unchanged; null is fine.
assert.deepEqual(normalizeEssayResult({ strengths: ['a'] } as never), { strengths: ['a'] });
assert.equal(normalizeEssayResult(null), null);
console.log('essay-result-normalize self-check passed');

// IELTS results: text lists inside criteria and at the top level.
import { normalizeIeltsResult } from './essay-result-normalize';
const ib = normalizeIeltsResult({ criteria: [{ code: 'LR', band: 6, strengths: [{ basic: 'big', better: 'vast' }], vocabularyErrors: ['x'] }], majorErrors: [{ error: 'tense', fix: 'use past' }], band9Suggestions: { vocabulary: { tip: 'collocations' } } }) as Record<string, any>;
assert.deepEqual(ib.criteria[0].strengths, ['big → vast']);
assert.deepEqual(ib.criteria[0].vocabularyErrors, ['x']);
assert.equal(ib.criteria[0].band, 6);
assert.deepEqual(ib.majorErrors, ['tense — use past']);
assert.equal(ib.band9Suggestions.vocabulary, 'collocations');
console.log('ielts normalize self-check passed');
