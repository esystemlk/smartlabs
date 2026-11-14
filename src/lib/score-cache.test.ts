// Self-check for the "same answer, same score" keys. Run: npx tsx src/lib/score-cache.test.ts
import assert from 'node:assert/strict';
import { scoreCacheKey } from './score-cache';

const k = (essay: string, extra: unknown[] = []) => scoreCacheKey('pte-essay', 'v1', ['Topic A', essay, ...extra]);
// Whitespace/line-ending differences are the same answer.
assert.equal(k('One two  three.\r\nFour'), k('One two three. Four'));
// Any real edit is a different answer.
assert.notEqual(k('One two three.'), k('One two three!'));
assert.notEqual(k('One two three.'), k('One two four.'));
// Options that change the result are part of the key.
assert.notEqual(k('Same', [true]), k('Same', [false]));
assert.notEqual(k('Same', [65]), k('Same', [79]));
// Different task kinds or prompt versions never share results.
assert.notEqual(scoreCacheKey('pte-swt', 'v1', ['x']), scoreCacheKey('pte-sst', 'v1', ['x']));
assert.notEqual(scoreCacheKey('pte-swt', 'v1', ['x']), scoreCacheKey('pte-swt', 'v2', ['x']));
console.log('score-cache self-check passed');
