// Self-check for saved-answer audio parsing. Run: npx tsx src/lib/answer-review-audio.test.ts
import assert from 'node:assert/strict';
import { reviewAudioFrom, MAX_REVIEW_AUDIO_BYTES } from './answer-review-audio';

const audio = Buffer.alloc(1000, 7);
const uri = (mime: string, b = audio) => `data:${mime};base64,${b.toString('base64')}`;

const webm = reviewAudioFrom({ dataUri: uri('audio/webm;codecs=opus') });
assert.equal(webm?.mime, 'audio/webm');
assert.equal(webm?.ext, 'webm');
assert.equal(webm?.bytes.length, 1000);
assert.equal(reviewAudioFrom({ dataUri: uri('audio/mp4') })?.ext, 'm4a');
assert.equal(reviewAudioFrom({ bytes: audio, mimeType: 'audio/mpeg' })?.ext, 'mp3');
assert.equal(reviewAudioFrom({ bytes: audio })?.mime, 'audio/webm');
assert.equal(reviewAudioFrom({ dataUri: uri('audio/webm', Buffer.alloc(50)) }), null, 'too short');
assert.equal(reviewAudioFrom({ bytes: Buffer.alloc(MAX_REVIEW_AUDIO_BYTES + 1) }), null, 'too big');
assert.equal(reviewAudioFrom({ dataUri: 'data:text/plain;base64,aGVsbG8=' }), null, 'not audio');
assert.equal(reviewAudioFrom({ dataUri: 'data:audio/webm' }), null, 'no payload');
console.log('answer-review-audio: all checks passed');
